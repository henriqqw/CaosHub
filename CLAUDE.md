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
| PDF | pdf-lib + pdfjs-dist |
| Drag & Drop | @hello-pangea/dnd |
| ZIP | jszip + file-saver |

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
Font: Inter (Google Fonts). Icons: Lucide React (consistent stroke, never decorative-only).

---

## Folder Structure

```
src/
├── components/
│   ├── layout/          # BubbleMenu, Layout
│   └── ui/              # Button, Badge, FileUploadZone, Toast, ProgressBar
├── hooks/               # useToast, useFileUpload
├── lib/                 # utils.ts (cn, formatBytes, downloadBlob)
├── pages/               # Home.tsx
└── tools/
    ├── merge-pdf/       # MergePDF tool (pdf-lib + pdfjs-dist)
    ├── frame-extractor/ # FrameExtractor tool (Canvas API + jszip)
    └── webp-converter/  # WebPConverter tool (Canvas API)
```

Each tool is self-contained: `ToolName.tsx` (page) + `components/` + `hooks/` + `utils/`.

---

## Tool Registry

| Tool | Route | Description |
|------|-------|-------------|
| MergePDF | `/tools/merge-pdf` | Merge multiple PDFs client-side (pdf-lib) |
| FrameExtractor | `/tools/frame-extractor` | Extract video frames as PNG/JPEG/ZIP (Canvas API) |
| WebPConverter | `/tools/webp-converter` | Convert images to WebP (Canvas API) |

---

## Conventions

- **No global state** — no Redux, no Context. Each tool manages its own state via local `useState` + custom hooks.
- **Shared components** live in `src/components/ui/` — reuse before creating new.
- **Tool logic** is isolated in `src/tools/<tool>/utils/` — pure functions, no React deps.
- **Hooks** in `src/tools/<tool>/hooks/` wrap tool logic for component consumption.
- **Downloads** use `downloadBlob()` from `src/lib/utils.ts`.
- TypeScript strict mode. No `any` unless unavoidable.
- Tailwind utility classes only — no inline styles, no CSS modules (except `index.css` for tokens).
- Framer Motion: 150–250ms, ease-in-out. No bounce, no elastic, no long transitions.

---

## SOLID Reminders

- **S** — Each component/utility has one responsibility.
- **O** — UI components accept variant props instead of being forked.
- **L** — Tools can be swapped out independently.
- **I** — Hooks/utils expose minimal interfaces.
- **D** — Tools depend on abstractions (FileUploadZone, downloadBlob) not concretions.

---

## Adding a New Tool

1. Create `src/tools/<tool-name>/` with: `ToolName.tsx`, `components/`, `hooks/`, `utils/`
2. Add route in `src/App.tsx`
3. Add card to `src/pages/Home.tsx` tool registry array
4. Update this file's Tool Registry table
