# CaosHub

CaosHub is a toolbox of web utilities.
Most tools run 100% in the browser. Backend-powered routes (`Media Downloader`, `Transcriber`) run on FastAPI.

**Live:** https://caoshub.vercel.app

---

## Tools (25)

### PDF
| Tool | Route | Description |
|------|-------|-------------|
| MergePDF | `/tools/merge-pdf` | Combine multiple PDFs, drag to reorder |
| PDF -> Imagens | `/tools/pdf-to-images` | Render pages as PNG/JPEG at 1x/2x/3x |
| Dividir PDF | `/tools/pdf-splitter` | Split by page, chunk, or custom range |
| Proteger PDF | `/tools/pdf-protect` | Add password + permissions (AES) |

### Imagem
| Tool | Route | Description |
|------|-------|-------------|
| Image Converter | `/tools/image-converter` | JPEG / PNG / WebP with quality control |
| Image Compressor | `/tools/image-compressor` | Compress with before/after comparison |
| Color Palette | `/tools/color-palette` | Extract dominant colors as hex/RGB/CSS |
| Remover Fundo | `/tools/background-removal` | AI background removal (WASM, local) |
| Editor de Imagem | `/tools/image-editor` | Resize, crop, flip, rotate |
| Favicon Generator | `/tools/favicon-generator` | 10 sizes + ZIP download |

### Video / Audio
| Tool | Route | Description |
|------|-------|-------------|
| Frame Extractor | `/tools/frame-extractor` | Extract frames as PNG/JPEG/ZIP |
| Converter Video | `/tools/video-converter` | MP4 / WebM / MKV via FFmpeg.wasm |
| Cortar Video | `/tools/video-trimmer` | Trim by start/end (stream copy) |
| Converter Audio | `/tools/audio-converter` | MP3 / WAV / OGG / FLAC / AAC |
| Media Downloader | `/tools/media-downloader` | URL(s) -> MP4/MP3 with low/full presets and ZIP for batch |
| Transcriber | `/tools/transcriber` | Whisper transcription + subtitles (TXT + SRT ZIP) |

### Texto
| Tool | Route | Description |
|------|-------|-------------|
| Contador de Caracteres | `/tools/character-counter` | chars, words, read time and more |
| Markdown Preview | `/tools/markdown-preview` | Live editor + preview + HTML export |

### Utilidade
| Tool | Route | Description |
|------|-------|-------------|
| QR Code | `/tools/qr-code` | Generate QR codes, export PNG/SVG |
| Gerador de Senhas | `/tools/password-generator` | Crypto-secure, strength meter, batch |

### Dev
| Tool | Route | Description |
|------|-------|-------------|
| JSON Formatter | `/tools/json-formatter` | Format, minify, validate JSON |
| Hash Generator | `/tools/hash-generator` | MD5 + SHA-1/256/384/512 for text/files |
| JWT Decoder | `/tools/jwt-decoder` | Decode header/payload, show expiry |
| UUID Generator | `/tools/uuid-generator` | UUID v4 via `crypto.randomUUID()`, batch |
| Encoder | `/tools/encoder` | Base64 / URL / HTML encode+decode |

---

## Tech Stack

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS v4
- React Router + Framer Motion + Lucide
- Browser processing libs (`pdf-lib`, `ffmpeg.wasm`, etc.)

### Media Backend
- FastAPI + Uvicorn
- yt-dlp for extraction
- ffmpeg for remux/conversion
- faster-whisper for transcription + subtitle generation
- In-memory job queue + temporary file storage

---

## Running Locally

### Frontend
```bash
npm install
npm run dev
```

### Media backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Create `.env.example` -> `.env` in project root:
```bash
VITE_MEDIA_API_URL=http://localhost:8000
```

---

## Deploy

- Frontend: Vercel
- Media backend: Render (`render.yaml` + `backend/Dockerfile`)

---

## Notes

- URL-based downloading depends on public availability and extractor support.
- DRM, private content, paywalls, or platform restrictions can fail.
- Spotify track/album/playlist links are protected and not directly downloadable.

---

## License

MIT
