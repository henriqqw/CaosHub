# CaosHub — Architecture & Context

## 1. Project Goal

CaosHub is a hub of browser-only tools. All processing happens client-side. No server, no uploads, no API calls. Each tool is an independent React module sharing a common design system and layout shell.

---

## 2. Routing

React Router v6 (`BrowserRouter`):

```
/                        → Home (tool grid)
/tools/merge-pdf         → MergePDF
/tools/frame-extractor   → FrameExtractor
/tools/webp-converter    → WebPConverter
```

`<Layout>` wraps all routes — renders `<BubbleMenu>` + `<Outlet>`.

---

## 3. Component Tree

```
App (BrowserRouter)
└── Layout
    ├── BubbleMenu          # Floating nav pill, top-center
    └── Outlet
        ├── Home            # / — tool grid
        ├── MergePDF        # /tools/merge-pdf
        │   ├── PdfDropZone
        │   ├── PdfList
        │   │   └── PdfCard (×n)
        │   └── MergeButton
        ├── FrameExtractor  # /tools/frame-extractor
        │   ├── VideoUpload
        │   ├── ExtractionConfig
        │   └── FrameResults
        └── WebPConverter   # /tools/webp-converter
            ├── ImageDropZone
            └── ConversionList
                └── ConversionItem (×n)
```

---

## 4. Shared UI Components

### `Button` (`src/components/ui/Button.tsx`)
Props: `variant` (primary | ghost | danger), `loading`, `disabled`, `onClick`, `children`
- Primary: red bg (`#FF2222`), white text
- Ghost: transparent bg, border, white text
- Danger: red border + text
- Loading: spinner replaces children, pointer-events none
- Hover: Framer Motion scale 0.97

### `Badge` (`src/components/ui/Badge.tsx`)
Props: `variant` (default | success | error | warning | accent), `children`

### `FileUploadZone` (`src/components/ui/FileUploadZone.tsx`)
Props: `accept` (string), `multiple` (bool), `onFiles` (File[]) => void, `maxSize` (bytes), `children`
States: idle | drag-over | error
- Drag-over: border color → accent red
- Error: border color → error red, shows error message
- Click anywhere → opens file picker
- Validates file type + size before calling `onFiles`

### `Toast` + `useToast` (`src/components/ui/Toast.tsx`, `src/hooks/useToast.ts`)
`useToast()` returns `{ toasts, toast }`. `toast({ type, message })` adds to queue.
Types: success | error | warning
Auto-dismiss: 4000ms. Closable. Stacks up to 5. Top-right fixed.

### `ProgressBar` (`src/components/ui/ProgressBar.tsx`)
Props: `value` (0–100), `label`, `animated`
Framer Motion width animation.

---

## 5. Shared Hooks

### `useFileUpload` (`src/hooks/useFileUpload.ts`)
```ts
useFileUpload({ accept, maxSize, multiple })
→ { isDragging, error, getRootProps, getInputProps, open }
```
Wraps drag-and-drop logic. Used by `FileUploadZone`.

### `useToast` (`src/hooks/useToast.ts`)
```ts
useToast()
→ { toasts, toast, dismiss }
```

---

## 6. Shared Utilities (`src/lib/utils.ts`)

```ts
cn(...classes)          // Tailwind class merge utility
formatBytes(bytes)      // "1.2 MB", "512 KB", etc.
downloadBlob(blob, filename)  // Creates object URL, triggers download, revokes
generateId()            // crypto.randomUUID() wrapper
```

---

## 7. Tool: MergePDF

### Purpose
Merge multiple PDF files into one, entirely in the browser.

### Libraries
- `pdf-lib` — creates merged PDF document
- `pdfjs-dist` — renders thumbnail of first page

### State (usePdfFiles hook)
```ts
interface PdfFile {
  id: string
  name: string
  size: number
  buffer: ArrayBuffer
  thumbnail: string | null  // base64 dataURL
}
state: PdfFile[]
```

### Data Flow
```
User drops PDFs
  → FileReader.readAsArrayBuffer()
  → renderThumbnail() [async, pdfjs-dist → canvas → dataURL]
  → usePdfFiles adds to list
  → User reorders via @hello-pangea/dnd
  → User clicks "Merge PDFs"
  → mergePdfs(buffers[]) [pdf-lib → PDFDocument → copyPages → save()]
  → downloadBlob(result, "merged.pdf")
```

### Key Utils
- `mergePdfs(buffers: ArrayBuffer[]): Promise<Uint8Array>` — creates PDFDocument, loads each, copies all pages, returns bytes
- `renderThumbnail(buffer: ArrayBuffer): Promise<string>` — getPage(1) → render to canvas → toDataURL('image/jpeg', 0.85)

---

## 8. Tool: FrameExtractor

### Purpose
Extract frames from a video file as images or ZIP archive.

### Libraries
- `jszip` — creates ZIP of frames
- `file-saver` — triggers download

### Phases
```
upload → config → processing → done
```

### State (useFrameExtractor hook)
```ts
phase: 'upload' | 'config' | 'processing' | 'done'
videoFile: File | null
videoMeta: { duration, width, height }
config: {
  mode: 'first' | 'fps' | 'count'
  fps: number         // for mode=fps
  count: number       // for mode=count
  format: 'png' | 'jpeg'
  outputWidth: number | null  // null = original
}
progress: number      // 0-100
frames: string[]      // dataURLs
stopRef: RefObject<boolean>
```

### Data Flow
```
User uploads video
  → <video> element reads File
  → onloadedmetadata captures duration/dimensions
  → User configures extraction (mode, fps/count, format, resolution)
  → extractFrames(video, config) starts
    → for each timestamp:
        video.currentTime = t
        await seeked event
        ctx.drawImage(video, ...)
        frame = canvas.toDataURL('image/png' | 'image/jpeg', 0.95)
    → progress updates
  → frames array populated
  → User downloads: individual files or ZIP (jszip)
```

### Key Utils
- `extractFrames(video, config, onProgress, stopRef): Promise<string[]>` — core Canvas API loop
- Timestamps calculated:
  - `fps` mode: `[0, 1/fps, 2/fps, ...]` up to duration
  - `count` mode: `[0, step, 2*step, ...]` where `step = duration / count`
  - `first` mode: `[0]`

---

## 9. Tool: WebPConverter

### Purpose
Convert JPG/PNG/BMP/TIFF images to WebP format in the browser.

### Libraries
- None required — native Canvas API + `toDataURL('image/webp')`
- `jszip` + `file-saver` for batch ZIP download

### State (useWebPConverter hook)
```ts
interface ConversionItem {
  id: string
  file: File
  originalSize: number
  webpDataUrl: string | null
  webpSize: number | null
  status: 'pending' | 'converting' | 'done' | 'error'
  error: string | null
}
items: ConversionItem[]
quality: number  // 0.1–1.0, default 0.85
```

### Data Flow
```
User drops images (JPEG, PNG, BMP, TIFF, WebP)
  → items added with status=pending
  → convertToWebP(file, quality) for each:
      img = new Image()
      img.src = URL.createObjectURL(file)
      onload: canvas.drawImage(img, 0, 0, w, h)
              webpDataUrl = canvas.toDataURL('image/webp', quality)
              webpSize = base64 byte length approximation
  → item updated: status=done, webpDataUrl, webpSize
  → User downloads individual or "Download All" (ZIP)
```

### Key Utils
- `convertToWebP(file: File, quality: number): Promise<{ dataUrl: string, size: number }>` — Canvas API conversion
- `dataUrlToBlob(dataUrl: string): Blob` — for individual downloads

---

## 10. State Management Strategy

- **No global state** (no Redux, no Context API)
- Each tool manages state via local `useState` + custom hook in `src/tools/<tool>/hooks/`
- Toast state is the only cross-cutting concern — `useToast` is called at tool page level
- No sessionStorage, no localStorage (tools are stateless between visits — intentional)

---

## 11. Motion Strategy (Framer Motion)

- Page mount: `initial={{ opacity: 0, y: 10 }}` → `animate={{ opacity: 1, y: 0 }}`, 200ms ease-in-out
- BubbleMenu: fade + translate-y on mount
- Button hover: `whileHover={{ scale: 0.97 }}`
- Card hover: `whileHover={{ scale: 1.02 }}`
- ProgressBar: `animate={{ width: "X%" }}`, spring
- Forbidden: bounce, elastic, > 300ms transitions, decorative-only animations

---

## 12. Build & Deploy

- `npm run dev` — Vite dev server
- `npm run build` — TypeScript check + Vite build → `dist/`
- `npm run preview` — preview production build locally
- **Vercel**: auto-detects Vite, builds from root, output `dist/`
- `vercel.json` SPA rewrite: all paths → `/index.html`
