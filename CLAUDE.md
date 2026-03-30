# CaosHub — Claude Project Memory

## Project Overview
CaosHub is an all-client-side web tool hub. No backend, no API. Every tool runs entirely in the browser.

- **Live URL**: https://caoshub.vercel.app (Vercel)
- **Repo**: https://github.com/henriqqw/CaosHub
- **Owner**: henriqqw

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Animation | Framer Motion |
| Icons | Lucide React |
| PDF read/write | pdf-lib + pdfjs-dist |
| PDF encryption | @cantoo/pdf-lib (fork of pdf-lib with encrypt()) |
| Drag & Drop | @hello-pangea/dnd |
| ZIP | jszip + file-saver |
| QR Code | qrcode |
| SEO | react-helmet-async |
| Analytics | @vercel/analytics |
| Background removal | @imgly/background-removal (WASM + AI, CDN) |
| Video / Audio | @ffmpeg/ffmpeg + @ffmpeg/util (WASM, CDN core) |
| Markdown | marked |
| MD5 hashing | spark-md5 |

---

## Design Tokens

| Token | Value |
|-------|-------|
| Background Primary | `#0A0A0A` |
| Background Secondary | `#111111` |
| Surface | `#1A1A1A` |
| Border | `#2A2A2A` |
| Text Primary | `#FFFFFF` |
| Text Secondary | `#A0A0A0` |
| Accent | `#FF2222` |
| Accent Hover | `#CC0000` |
| Error | `#FF4D4D` |
| Warning | `#FFC857` |

Tailwind classes: `bg-bg-primary`, `bg-surface`, `text-accent`, `border-border`, etc.
Font: Inter (Google Fonts). Icons: Lucide React.

---

## Folder Structure

```
src/
├── components/
│   ├── layout/          # DesktopSidebar, MobileSidebar, Layout, Footer
│   └── ui/              # Button, FileUploadZone, Toast, ProgressBar, Badge
├── hooks/               # useToast, useFileUpload
├── lib/                 # utils.ts (cn, formatBytes, downloadBlob, generateId, dataUrlToBlob)
├── pages/               # Home.tsx
└── tools/
    ├── merge-pdf/
    ├── pdf-to-images/
    ├── pdf-splitter/
    ├── pdf-protect/          # @cantoo/pdf-lib
    ├── image-converter/
    ├── image-compressor/
    ├── color-palette/
    ├── background-removal/   # @imgly/background-removal (WASM AI, CDN)
    ├── image-editor/         # resize / flip / rotate / crop — Canvas API
    ├── favicon-generator/    # multi-size PNGs + JSZip
    ├── frame-extractor/
    ├── video-converter/      # FFmpeg.wasm (CDN core)
    ├── video-trimmer/        # FFmpeg.wasm (stream copy)
    ├── audio-converter/      # FFmpeg.wasm
    ├── character-counter/
    ├── markdown-preview/     # marked
    ├── qr-code/
    ├── password-generator/
    ├── json-formatter/
    ├── hash-generator/       # crypto.subtle + spark-md5
    ├── jwt-decoder/
    ├── uuid-generator/
    └── encoder/              # Base64 / URL / HTML
```

---

## Tool Registry (23 tools)

### PDF
| Tool | Route |
|------|-------|
| MergePDF | `/tools/merge-pdf` |
| PdfToImages | `/tools/pdf-to-images` |
| PdfSplitter | `/tools/pdf-splitter` |
| PdfProtect | `/tools/pdf-protect` |

### Imagem
| Tool | Route |
|------|-------|
| ImageConverter | `/tools/image-converter` |
| ImageCompressor | `/tools/image-compressor` |
| ColorPalette | `/tools/color-palette` |
| BackgroundRemoval | `/tools/background-removal` |
| ImageEditor | `/tools/image-editor` |
| FaviconGenerator | `/tools/favicon-generator` |

### Vídeo / Áudio
| Tool | Route |
|------|-------|
| FrameExtractor | `/tools/frame-extractor` |
| VideoConverter | `/tools/video-converter` |
| VideoTrimmer | `/tools/video-trimmer` |
| AudioConverter | `/tools/audio-converter` |

### Texto
| Tool | Route |
|------|-------|
| CharacterCounter | `/tools/character-counter` |
| MarkdownPreview | `/tools/markdown-preview` |

### Utilidade
| Tool | Route |
|------|-------|
| QRCodeTool | `/tools/qr-code` |
| PasswordGenerator | `/tools/password-generator` |

### Dev
| Tool | Route |
|------|-------|
| JsonFormatter | `/tools/json-formatter` |
| HashGenerator | `/tools/hash-generator` |
| JwtDecoder | `/tools/jwt-decoder` |
| UuidGenerator | `/tools/uuid-generator` |
| Encoder | `/tools/encoder` |

---

## Sidebar Structure

```
Home
─────────────────
PDF
  MergePDF · PDF→Imagens · Dividir PDF · Proteger PDF
Imagem
  Converter · Comprimir · Paleta · Remover Fundo · Editar · Favicon
Vídeo / Áudio
  Frame Extractor · Converter Vídeo · Cortar Vídeo · Converter Áudio
Texto
  Contador · Markdown
Utilidade
  QR Code · Senhas
Dev
  JSON · Hash · JWT · UUID · Encoder
```

---

## Critical Conventions

- **No global state** — each tool manages its own state via `useState` + custom hooks.
- **Shared components** in `src/components/ui/` — reuse before creating new.
- TypeScript strict mode. No `any` unless unavoidable.
- Tailwind utility classes only — no inline styles except where Tailwind can't do it.
- Framer Motion: 150–250ms, ease-in-out. No bounce, no elastic.
- FFmpeg WASM core loads from CDN (`unpkg.com/@ffmpeg/core@0.12.6`) — never bundled.
- Background removal AI model loads from IMG.LY CDN on first use (~50MB, cached after).
- **Uint8Array → Blob fix**: always cast `(bytes as Uint8Array).buffer as ArrayBuffer` when passed to `new Blob([...])` — required by TypeScript strict mode.
- PDF encryption: use `@cantoo/pdf-lib` (not `pdf-lib`) — pdf-lib v1.x has no encrypt().

---

## Adding a New Tool

1. Create `src/tools/<tool-name>/ToolName.tsx`
2. Add lazy route in `src/App.tsx`
3. Add card to `src/pages/Home.tsx` tools array + update count
4. Add `<Helmet>` SEO block (title, description, canonical, og:*, twitter:*)
5. Add NavLink + icon to `src/components/layout/Sidebar.tsx` under correct category
6. Add link to `src/components/layout/Footer.tsx`
7. Add URL to `public/sitemap.xml`
8. Update this file's Tool Registry table
