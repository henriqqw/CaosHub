from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import secrets
import shutil
import subprocess
import time
import zipfile
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field, field_validator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("caoshub")

# ---------------------------------------------------------------------------
# Rate limiting — sliding window per IP
# ---------------------------------------------------------------------------
_rate_store: dict[str, list[float]] = defaultdict(list)
_rate_lock = asyncio.Lock()
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "20"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))


async def rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    async with _rate_lock:
        window = [t for t in _rate_store[ip] if now - t < RATE_LIMIT_WINDOW]
        if len(window) >= RATE_LIMIT_REQUESTS:
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests — max {RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW}s.",
            )
        window.append(now)
        _rate_store[ip] = window


class OutputFormat(str, Enum):
    MP4 = "mp4"
    MP3 = "mp3"


class QualityPreset(str, Enum):
    LOW = "low"
    FULL = "full"


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


def validate_http_url(value: str) -> str:
    normalized = value.strip()
    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("URL must start with http:// or https://")
    if not parsed.netloc:
        raise ValueError("Invalid URL")
    return normalized


class ResolveRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2048)
    format: OutputFormat = OutputFormat.MP4
    quality: QualityPreset = QualityPreset.FULL

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        return validate_http_url(value)


@dataclass
class TranscriptionJobRecord:
    id: str
    source_filename: str
    source_path: Path
    work_dir: Path
    created_at: datetime
    updated_at: datetime
    requested_language: str | None = None
    detected_language: str | None = None
    status: JobStatus = JobStatus.QUEUED
    progress: int = 0
    error: str | None = None
    filename: str | None = None
    file_path: Path | None = None
    duration_seconds: float | None = None


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def parse_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


API_TITLE = "CaosHub Media Backend"
API_VERSION = "0.2.0"
ALLOWED_ORIGINS = parse_origins(os.getenv("ALLOWED_ORIGINS", "http://localhost:5173"))
STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", "./backend/storage")).resolve()
YTDLP_COOKIES_FILE = os.getenv("YTDLP_COOKIES_FILE", "")
JOB_TTL_MINUTES = max(5, int(os.getenv("JOB_TTL_MINUTES", "45")))
CLEANUP_INTERVAL_SECONDS = max(30, int(os.getenv("CLEANUP_INTERVAL_SECONDS", "60")))
RESOLVE_TIMEOUT_SECONDS = max(30, int(os.getenv("RESOLVE_TIMEOUT_SECONDS", "60")))
MAX_TRANSCRIPTION_FILE_MB = max(10, int(os.getenv("MAX_TRANSCRIPTION_FILE_MB", "500")))
MAX_TRANSCRIPTION_FILE_BYTES = MAX_TRANSCRIPTION_FILE_MB * 1024 * 1024
TRANSCRIPTION_TIMEOUT_SECONDS = max(120, int(os.getenv("TRANSCRIPTION_TIMEOUT_SECONDS", "7200")))
MAX_TRANSCRIPTION_CONCURRENT_JOBS = max(1, int(os.getenv("MAX_TRANSCRIPTION_CONCURRENT_JOBS", "1")))
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

transcription_jobs: dict[str, TranscriptionJobRecord] = {}
transcription_jobs_lock = asyncio.Lock()
transcription_job_queue: asyncio.Queue[str] = asyncio.Queue()
transcription_worker_tasks: list[asyncio.Task[None]] = []
whisper_model_lock = asyncio.Lock()
whisper_model: Any | None = None

cleanup_task: asyncio.Task[None] | None = None


def tail_lines(text: str, limit: int = 12) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines[-limit:])


def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    return cleaned.strip("._") or "download"


def run_command(command: list[str], cwd: Path, timeout: int) -> None:
    completed = subprocess.run(
        command,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    if completed.returncode != 0:
        details = completed.stderr or completed.stdout or ""
        summary = tail_lines(details) or f"Command failed with exit code {completed.returncode}"
        raise RuntimeError(summary)


# ---------------------------------------------------------------------------
# Resolve: extract direct CDN URL from yt-dlp without downloading
# ---------------------------------------------------------------------------

def _ytdlp_base_args() -> list[str]:
    args = [
        "yt-dlp",
        "--no-playlist",
        "--no-warnings",
        "--extractor-args", "youtube:player_client=web,mweb,ios",
    ]
    if YTDLP_COOKIES_FILE:
        args += ["--cookies", YTDLP_COOKIES_FILE]
    return args


def _pick_best_format(
    formats: list[dict[str, Any]],
    output_format: OutputFormat,
    quality: QualityPreset,
) -> dict[str, Any] | None:
    """
    Select the best pre-muxed format (single URL) so the browser downloads
    directly from the CDN without server-side storage or merging.
    """
    if output_format is OutputFormat.MP3:
        # Return best audio-only stream; browser will download as m4a/webm
        audio = [
            f for f in formats
            if f.get("url")
            and f.get("acodec", "none") not in ("none", None)
            and f.get("vcodec", "none") in ("none", None)
        ]
        if not audio:
            audio = [f for f in formats if f.get("url") and f.get("acodec", "none") not in ("none", None)]
        if not audio:
            return None
        return sorted(audio, key=lambda f: f.get("abr") or f.get("tbr") or 0, reverse=True)[0]

    # MP4: prefer pre-muxed streams (both video and audio in one file)
    muxed = [
        f for f in formats
        if f.get("url")
        and f.get("vcodec", "none") not in ("none", None)
        and f.get("acodec", "none") not in ("none", None)
        and f.get("ext") == "mp4"
    ]
    if not muxed:
        muxed = [
            f for f in formats
            if f.get("url")
            and f.get("vcodec", "none") not in ("none", None)
            and f.get("acodec", "none") not in ("none", None)
        ]

    if not muxed:
        return None

    if quality is QualityPreset.LOW:
        # Pick lowest resolution that's still ≥240p
        candidates = [f for f in muxed if (f.get("height") or 0) <= 480]
        pool = candidates if candidates else muxed
        return sorted(pool, key=lambda f: f.get("height") or 0)[0]

    # FULL: pick highest resolution pre-muxed
    return sorted(muxed, key=lambda f: f.get("height") or 0, reverse=True)[0]


def run_resolve(url: str, output_format: OutputFormat, quality: QualityPreset) -> dict[str, Any]:
    if shutil.which("yt-dlp") is None:
        raise RuntimeError("yt-dlp is not installed in the server environment")

    parsed_host = urlparse(url).netloc.lower()
    if "spotify.com" in parsed_host:
        raise RuntimeError(
            "Spotify links are protected and cannot be downloaded. "
            "Podcast episodes may work depending on availability."
        )

    command = _ytdlp_base_args() + ["--dump-json", url]

    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=RESOLVE_TIMEOUT_SECONDS,
        check=False,
    )

    if completed.returncode != 0:
        details = completed.stderr or completed.stdout or ""
        summary = tail_lines(details) or f"yt-dlp exited with code {completed.returncode}"
        raise RuntimeError(summary)

    try:
        info = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("yt-dlp returned invalid JSON") from exc

    formats: list[dict[str, Any]] = info.get("formats", [])
    title: str = info.get("title") or info.get("id") or "download"
    ext_fallback: str = info.get("ext") or ("mp3" if output_format is OutputFormat.MP3 else "mp4")

    chosen = _pick_best_format(formats, output_format, quality)

    if chosen is None:
        # Fall back to the top-level URL if no suitable format found
        direct_url = info.get("url")
        if not direct_url:
            raise RuntimeError("No downloadable stream found for this URL")
        chosen = {"url": direct_url, "ext": ext_fallback, "filesize": info.get("filesize")}

    stream_url: str = chosen["url"]
    stream_ext: str = chosen.get("ext") or ext_fallback
    filesize: int | None = chosen.get("filesize") or chosen.get("filesize_approx")
    height: int | None = chosen.get("height")

    safe_title = sanitize_filename(title)
    filename = f"{safe_title}.{stream_ext}"

    return {
        "url": stream_url,
        "filename": filename,
        "ext": stream_ext,
        "title": title,
        "filesize": filesize,
        "height": height,
    }


# ---------------------------------------------------------------------------
# Transcription helpers (unchanged)
# ---------------------------------------------------------------------------

def normalize_language(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    if not re.fullmatch(r"[a-z]{2}(-[a-z]{2})?", normalized):
        raise ValueError("Language must be ISO code like 'pt' or 'en'")
    return normalized


def build_whisper_runtime_error(exc: Exception) -> str:
    raw_error = str(exc).strip() or exc.__class__.__name__
    message = f"Whisper runtime unavailable: {raw_error}"
    if "libgomp" in raw_error.lower():
        message += ". Missing system dependency: libgomp1."
    return message


def get_whisper_import_error() -> str | None:
    try:
        import faster_whisper  # noqa: F401
    except Exception as exc:
        return build_whisper_runtime_error(exc)
    return None


def format_srt_timestamp(seconds: float) -> str:
    total_ms = max(0, int(round(seconds * 1000)))
    hours = total_ms // 3_600_000
    minutes = (total_ms % 3_600_000) // 60_000
    secs = (total_ms % 60_000) // 1000
    millis = total_ms % 1000
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def write_transcription_outputs(
    segments: list[tuple[float, float, str]],
    output_dir: Path,
    base_name: str,
) -> tuple[Path, Path]:
    txt_path = output_dir / f"{base_name}.txt"
    srt_path = output_dir / f"{base_name}.srt"

    text_lines = [text for _, _, text in segments]
    txt_path.write_text("\n".join(text_lines), encoding="utf-8")

    srt_lines: list[str] = []
    for index, (start, end, text) in enumerate(segments, start=1):
        srt_lines.append(str(index))
        srt_lines.append(f"{format_srt_timestamp(start)} --> {format_srt_timestamp(end)}")
        srt_lines.append(text)
        srt_lines.append("")
    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")

    return txt_path, srt_path


def create_zip_archive(source_dir: Path, target_zip: Path) -> Path:
    with zipfile.ZipFile(target_zip, "w", compression=zipfile.ZIP_DEFLATE) as archive:
        for file in sorted(source_dir.iterdir()):
            if not file.is_file():
                continue
            archive.write(file, arcname=file.name)
    return target_zip


def run_transcription_pipeline(
    source_path: Path,
    work_dir: Path,
    base_name: str,
    language: str | None,
    model: Any,
) -> tuple[Path, str, str | None, float | None]:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is not installed in the server environment")

    prepared_audio = work_dir / "prepared-audio.wav"
    run_command(
        [
            "ffmpeg", "-y", "-i", str(source_path),
            "-vn", "-ac", "1", "-ar", "16000",
            str(prepared_audio),
        ],
        cwd=work_dir,
        timeout=TRANSCRIPTION_TIMEOUT_SECONDS,
    )

    segments_iter, info = model.transcribe(
        str(prepared_audio),
        task="transcribe",
        language=language,
        vad_filter=True,
    )

    segments: list[tuple[float, float, str]] = []
    for segment in segments_iter:
        text = segment.text.strip()
        if not text:
            continue
        segments.append((float(segment.start), float(segment.end), text))

    if not segments:
        raise RuntimeError("No speech content detected in this file")

    outputs_dir = work_dir / "outputs"
    outputs_dir.mkdir(parents=True, exist_ok=True)
    write_transcription_outputs(segments, outputs_dir, base_name)

    zip_path = create_zip_archive(outputs_dir, work_dir / f"transcription-{base_name}.zip")
    zip_name = sanitize_filename(zip_path.name)
    detected_language = getattr(info, "language", None)
    duration_seconds = float(getattr(info, "duration", 0) or 0) or None
    return zip_path, zip_name, detected_language, duration_seconds


async def get_whisper_model() -> Any:
    global whisper_model
    if whisper_model is not None:
        return whisper_model

    async with whisper_model_lock:
        if whisper_model is not None:
            return whisper_model

        try:
            from faster_whisper import WhisperModel
        except Exception as exc:
            raise RuntimeError(build_whisper_runtime_error(exc)) from exc

        def _load_model() -> Any:
            try:
                return WhisperModel(
                    WHISPER_MODEL_SIZE,
                    device=WHISPER_DEVICE,
                    compute_type=WHISPER_COMPUTE_TYPE,
                )
            except Exception as exc:
                raise RuntimeError(
                    f"Failed to initialize Whisper model '{WHISPER_MODEL_SIZE}' "
                    f"({WHISPER_DEVICE}/{WHISPER_COMPUTE_TYPE}). "
                    f"{build_whisper_runtime_error(exc)}"
                ) from exc

        whisper_model = await asyncio.to_thread(_load_model)
        return whisper_model


def transcription_job_to_payload(
    job: TranscriptionJobRecord,
    request: Request | None = None,
) -> dict[str, Any]:
    download_url: str | None = None
    if request is not None and job.status is JobStatus.COMPLETED:
        base_url = str(request.base_url).rstrip("/")
        download_url = f"{base_url}/api/transcriptions/jobs/{job.id}/download"

    return {
        "id": job.id,
        "status": job.status.value,
        "progress": job.progress,
        "source_filename": job.source_filename,
        "requested_language": job.requested_language,
        "detected_language": job.detected_language,
        "duration_seconds": job.duration_seconds,
        "filename": job.filename,
        "error": job.error,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
        "download_url": download_url,
    }


async def update_transcription_job(
    job_id: str, **changes: Any
) -> TranscriptionJobRecord | None:
    async with transcription_jobs_lock:
        job = transcription_jobs.get(job_id)
        if not job:
            return None
        for key, value in changes.items():
            setattr(job, key, value)
        job.updated_at = utcnow()
        return job


async def process_transcription_job(job_id: str) -> None:
    job = await update_transcription_job(
        job_id, status=JobStatus.PROCESSING, progress=10, error=None
    )
    if job is None:
        return

    try:
        model = await get_whisper_model()
        await update_transcription_job(job_id, progress=25)

        base_name = sanitize_filename(Path(job.source_filename).stem or "transcription")
        result_path, result_name, detected_language, duration_seconds = await asyncio.to_thread(
            run_transcription_pipeline,
            job.source_path,
            job.work_dir,
            base_name,
            job.requested_language,
            model,
        )

        await update_transcription_job(
            job_id,
            status=JobStatus.COMPLETED,
            progress=100,
            file_path=result_path,
            filename=result_name,
            detected_language=detected_language,
            duration_seconds=duration_seconds,
            error=None,
        )
    except Exception as exc:
        await update_transcription_job(
            job_id,
            status=JobStatus.FAILED,
            progress=100,
            error=str(exc),
            file_path=None,
            filename=None,
        )


async def transcription_worker_loop(worker_name: str) -> None:
    while True:
        job_id = await transcription_job_queue.get()
        try:
            await process_transcription_job(job_id)
        finally:
            transcription_job_queue.task_done()


async def cleanup_loop() -> None:
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
        cutoff = utcnow() - timedelta(minutes=JOB_TTL_MINUTES)
        stale: list[tuple[str, Path]] = []

        async with transcription_jobs_lock:
            for job_id, job in list(transcription_jobs.items()):
                if job.updated_at > cutoff:
                    continue
                if job.status not in {JobStatus.COMPLETED, JobStatus.FAILED}:
                    continue
                stale.append((job_id, job.work_dir))
                transcription_jobs.pop(job_id, None)

        for _, work_dir in stale:
            shutil.rmtree(work_dir, ignore_errors=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global cleanup_task

    STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

    for index in range(MAX_TRANSCRIPTION_CONCURRENT_JOBS):
        transcription_worker_tasks.append(
            asyncio.create_task(transcription_worker_loop(f"transcription-worker-{index + 1}"))
        )

    cleanup_task = asyncio.create_task(cleanup_loop())

    try:
        yield
    finally:
        for task in transcription_worker_tasks:
            task.cancel()
        if cleanup_task:
            cleanup_task.cancel()

        await asyncio.gather(*transcription_worker_tasks, return_exceptions=True)
        if cleanup_task:
            await asyncio.gather(cleanup_task, return_exceptions=True)


app = FastAPI(title=API_TITLE, version=API_VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
    expose_headers=["Content-Disposition"],
    max_age=600,
)


@app.middleware("http")
async def audit_log(request: Request, call_next: Any) -> Response:
    start = time.monotonic()
    response: Response = await call_next(request)
    duration = time.monotonic() - start
    ip = request.client.host if request.client else "unknown"
    logger.info(
        "method=%s path=%s status=%d ip=%s duration=%.3fs",
        request.method,
        request.url.path,
        response.status_code,
        ip,
        duration,
    )
    return response


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "")


@app.get("/api/internal/health")
async def health_internal(request: Request) -> dict[str, Any]:
    provided_key = request.headers.get("x-admin-key", "")
    if not ADMIN_SECRET_KEY or provided_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")
    whisper_error = get_whisper_import_error()
    return {
        "status": "ok",
        "yt_dlp": shutil.which("yt-dlp") is not None,
        "ffmpeg": shutil.which("ffmpeg") is not None,
        "transcription_queue_size": transcription_job_queue.qsize(),
        "transcription_workers": MAX_TRANSCRIPTION_CONCURRENT_JOBS,
        "whisper_available": whisper_error is None,
        "whisper_error": whisper_error,
        "whisper_model_loaded": whisper_model is not None,
        "whisper_model_size": WHISPER_MODEL_SIZE,
    }


@app.post("/api/resolve", dependencies=[Depends(rate_limit)])
async def resolve_media(payload: ResolveRequest) -> dict[str, Any]:
    """
    Resolve a media URL to a direct CDN stream URL using yt-dlp.
    The file is never downloaded to the server — the client downloads directly.
    """
    try:
        result = await asyncio.to_thread(
            run_resolve, payload.url, payload.format, payload.quality
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Timed out resolving media URL") from exc

    return result


@app.post("/api/transcriptions/jobs", status_code=202, dependencies=[Depends(rate_limit)])
async def create_transcription_job(
    request: Request,
    file: UploadFile = File(...),
    language: str | None = Form(default=None),
) -> dict[str, Any]:
    whisper_error = get_whisper_import_error()
    if whisper_error is not None:
        raise HTTPException(
            status_code=503,
            detail=(
                f"{whisper_error} Install backend requirements "
                "(pip install -r backend/requirements.txt) and redeploy."
            ),
        )

    try:
        requested_language = normalize_language(language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    original_name = file.filename or "upload-media"
    safe_name = sanitize_filename(Path(original_name).name)
    suffix = Path(safe_name).suffix or ".bin"
    source_name = safe_name if Path(safe_name).suffix else f"{safe_name}{suffix}"

    job_id = secrets.token_hex(8)
    work_dir = STORAGE_ROOT / f"transcription-{job_id}"
    work_dir.mkdir(parents=True, exist_ok=False)
    source_path = work_dir / source_name

    bytes_written = 0
    try:
        with source_path.open("wb") as output_file:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                bytes_written += len(chunk)
                if bytes_written > MAX_TRANSCRIPTION_FILE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Max allowed is {MAX_TRANSCRIPTION_FILE_MB} MB",
                    )
                output_file.write(chunk)
    except HTTPException:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to store uploaded file: {exc}") from exc
    finally:
        await file.close()

    if bytes_written == 0:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    timestamp = utcnow()
    job = TranscriptionJobRecord(
        id=job_id,
        source_filename=source_name,
        source_path=source_path,
        work_dir=work_dir,
        created_at=timestamp,
        updated_at=timestamp,
        requested_language=requested_language,
    )

    async with transcription_jobs_lock:
        transcription_jobs[job_id] = job

    await transcription_job_queue.put(job_id)
    return transcription_job_to_payload(job, request)


@app.get("/api/transcriptions/jobs/{job_id}")
async def get_transcription_job(job_id: str, request: Request) -> dict[str, Any]:
    async with transcription_jobs_lock:
        job = transcription_jobs.get(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="Transcription job not found")

    return transcription_job_to_payload(job, request)


@app.get("/api/transcriptions/jobs/{job_id}/download")
async def download_transcription_job_file(job_id: str) -> FileResponse:
    async with transcription_jobs_lock:
        job = transcription_jobs.get(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="Transcription job not found")
    if job.status is not JobStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="Transcription job is not complete yet")
    if not job.file_path or not job.file_path.exists():
        raise HTTPException(status_code=404, detail="Transcription output expired or missing")

    import mimetypes
    media_type = mimetypes.guess_type(job.file_path.name)[0] or "application/octet-stream"
    return FileResponse(
        path=job.file_path,
        media_type=media_type,
        filename=job.filename or job.file_path.name,
    )
