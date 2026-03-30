# CaosHub

A hub of browser-only tools. All processing happens client-side — no uploads, no server, no API. Your files never leave your device.

**Live:** https://caoshub.vercel.app

---

## Tools (23)

### PDF
| Tool | Route | Description |
|------|-------|-------------|
| MergePDF | `/tools/merge-pdf` | Combine multiple PDFs, drag to reorder |
| PDF → Imagens | `/tools/pdf-to-images` | Render pages as PNG/JPEG at 1×/2×/3× |
| Dividir PDF | `/tools/pdf-splitter` | Split by page, chunk, or custom range |
| Proteger PDF | `/tools/pdf-protect` | Add password + permissions (AES) |

### Imagem
| Tool | Route | Description |
|------|-------|-------------|
| Image Converter | `/tools/image-converter` | JPEG / PNG / WebP with quality control |
| Image Compressor | `/tools/image-compressor` | Compress with before/after comparison |
| Color Palette | `/tools/color-palette` | Extract dominant colors as hex/RGB/CSS |
| Remover Fundo | `/tools/background-removal` | AI background removal (WASM, runs locally) |
| Editor de Imagem | `/tools/image-editor` | Resize, crop, flip, rotate |
| Favicon Generator | `/tools/favicon-generator` | 10 sizes + ZIP download |

### Vídeo / Áudio
| Tool | Route | Description |
|------|-------|-------------|
| Frame Extractor | `/tools/frame-extractor` | Extract frames as PNG/JPEG/ZIP |
| Converter Vídeo | `/tools/video-converter` | MP4 / WebM / MKV via FFmpeg.wasm |
| Cortar Vídeo | `/tools/video-trimmer` | Trim by start/end (stream copy) |
| Converter Áudio | `/tools/audio-converter` | MP3 / WAV / OGG / FLAC / AAC |

### Texto
| Tool | Route | Description |
|------|-------|-------------|
| Contador de Caracteres | `/tools/character-counter` | 10 text stats: chars, words, read time |
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
| Hash Generator | `/tools/hash-generator` | MD5 + SHA-1/256/384/512 for text or files |
| JWT Decoder | `/tools/jwt-decoder` | Decode header/payload, show expiry |
| UUID Generator | `/tools/uuid-generator` | UUID v4 via `crypto.randomUUID()`, batch |
| Encoder | `/tools/encoder` | Base64 / URL / HTML encode+decode |

---

## Tech Stack

- **React 18** + **Vite** + **TypeScript** (strict mode)
- **Tailwind CSS v4** — dark theme (`#0A0A0A`), red accent (`#FF2222`)
- **React Router v6** — client-side routing, lazy-loaded tool chunks
- **Framer Motion** — animations (150–250ms, no bounce)
- **Lucide React** — icons
- **pdf-lib** + **@cantoo/pdf-lib** + **pdfjs-dist** — PDF processing and encryption
- **@ffmpeg/ffmpeg** + **@ffmpeg/util** — video/audio via FFmpeg WASM (CDN core)
- **@imgly/background-removal** — AI background removal (WASM, CDN model)
- **marked** — Markdown rendering
- **spark-md5** — MD5 hashing
- **jszip** + **file-saver** — ZIP export
- **qrcode** — QR code generation
- **react-helmet-async** — per-page SEO
- **@vercel/analytics** — analytics

---

## Running Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

---

## Adding a New Tool

1. Create `src/tools/<tool-name>/ToolName.tsx`
2. Add lazy route in `src/App.tsx`
3. Add card to `src/pages/Home.tsx` tools array + update count
4. Add `<Helmet>` SEO block to the tool page
5. Add NavLink + icon to `src/components/layout/Sidebar.tsx`
6. Add link to `src/components/layout/Footer.tsx`
7. Add URL to `public/sitemap.xml`
8. Update `CLAUDE.md` Tool Registry

See `CLAUDE.md` for full conventions and `CONTEXT.md` for architecture details.

---

## Deploy

Hosted on Vercel. Push to `main` triggers auto-deploy. All routes rewrite to `/index.html` (SPA).

---

## License

MIT
