# Media Backend (FastAPI)

Backend assíncrono para:
- extração e download de mídia por URL (`yt-dlp` + `ffmpeg`)
- transcrição e legenda automática (`faster-whisper` + `ffmpeg`)

## Requisitos

- Python 3.11+
- ffmpeg instalado no sistema
- `faster-whisper` e runtime compatível (`libgomp1` no Linux/Docker)

## Rodar local

```bash
cd backend
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell
# .\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /api/health`
- `POST /api/jobs`
- `GET /api/jobs/{job_id}`
- `GET /api/jobs/{job_id}/download`
- `POST /api/transcriptions/jobs`
- `GET /api/transcriptions/jobs/{job_id}`
- `GET /api/transcriptions/jobs/{job_id}/download`

### POST /api/jobs

Request body (single):

```json
{
  "url": "https://example.com/video",
  "format": "mp4",
  "quality": "full"
}
```

Request body (batch):

```json
{
  "urls": [
    "https://example.com/a",
    "https://example.com/b"
  ],
  "format": "mp3",
  "quality": "low"
}
```

Batch jobs generate a final ZIP file for download.

### POST /api/transcriptions/jobs

`multipart/form-data`:
- `file`: audio/video file
- `language` (optional): ISO code like `pt`, `en`, `es`

Output is a ZIP containing:
- `{name}.txt` transcript
- `{name}.srt` subtitles

## Notas

- A fila inicial usa memória local (single-instance).
- Batch limit: 25 URLs per job.
- Transcription file limit: `MAX_TRANSCRIPTION_FILE_MB` (default 500 MB).
- Se `/api/health` retornar `whisper_available=false`, verifique `whisper_error` para diagnóstico.
- Conteúdo protegido por DRM/paywall pode falhar.
- Links Spotify de track/album/playlist não são baixáveis diretamente.
