# SYSTEM DESIGN — CaosHub

---

## 1. Design Philosophy

The system MUST follow a **professional, minimalist, high-performance interface**.

Core principles:

- Visual hierarchy MUST be clear and intentional
- Interface MUST be compact (high information density)
- Interactions MUST be fast and predictable
- Every element MUST serve a purpose

---

## 2. Visual Identity

### 2.1 Theme

- Dark Theme ONLY
- Monochrome base (black / dark gray scale)
- Accent color: **Red**

### 2.2 Color System

| Role | Color |
| ---- | ----- |
| Background Primary | #0A0A0A |
| Background Secondary | #111111 |
| Surface | #1A1A1A |
| Border | #2A2A2A |
| Text Primary | #FFFFFF |
| Text Secondary | #A0A0A0 |
| Accent (Primary) | #FF2222 (Red) |
| Accent Hover | #CC0000 |
| Error | #FF4D4D |
| Warning | #FFC857 |

### 2.3 Typography

- Font: Inter (via Google Fonts)
- Weight usage: 600 (titles), 500 (sections), 400 (body)
- Tight spacing (compact layout)

### 2.4 Iconography

- Primary: **Lucide Icons**
- Icons MUST be minimal, consistent stroke, never decorative-only

---

## 3. Layout

### 3.1 Navigation — BubbleMenu

- Floating nav pill at top-center
- Contains: CaosHub logo (left), tool links (right)
- Tool links: Home, MergePDF, FrameExtractor, WebP Converter
- Active route: red accent highlight
- Framer Motion: fade + translate-y on mount (200ms)
- Always visible on all routes

### 3.2 Pages

**Home (`/`)**

- Hero section: CaosHub title + tagline ("Browser-only tools. No uploads. No server.")
- Tool grid: 3 columns desktop / 2 tablet / 1 mobile
- Tool card: icon, name, description, "Open Tool" button
- Card hover: border highlight (accent) + scale 1.02

**MergePDF (`/tools/merge-pdf`)**

- Drop zone for multiple PDFs
- Reorderable list with thumbnails (@hello-pangea/dnd)
- Merge button (disabled if < 2 PDFs)
- Download on merge complete

**FrameExtractor (`/tools/frame-extractor`)**

- Phase 1 — Upload: drag-drop video
- Phase 2 — Config: mode (first/fps/count), format (PNG/JPEG), output resolution
- Phase 3 — Processing: animated progress bar, cancel button
- Phase 4 — Done: frame count, download individual or all as ZIP

**WebPConverter (`/tools/webp-converter`)**

- Drag-drop images (JPEG, PNG, BMP, TIFF)
- Quality slider (10%–100%, default 85%)
- Per-image: original size → WebP size, size savings badge
- Individual download button per image
- "Download All as ZIP" button
- Remove individual item

---

## 4. UI Components

### 4.1 Cards

- Background: `#1A1A1A` (surface)
- Border: `#2A2A2A` (border)
- No heavy shadows
- Hover: border → accent color

### 4.2 Buttons

| Variant | Style |
|---------|-------|
| Primary | Red background (`#FF2222`), white text |
| Ghost | Transparent bg, `#2A2A2A` border, white text |
| Danger | `#FF4D4D` border + text, transparent bg |

- Framer Motion: `whileHover={{ scale: 0.97 }}`
- Loading state: spinner replaces label, pointer-events none
- Disabled: 40% opacity

### 4.3 Inputs & File Zones

- Background: `#111111`
- Border: `#2A2A2A`, focus → `#FF2222` glow
- Drag-over: border → `#FF2222`, background tint
- Error: border → `#FF4D4D`, error message below

### 4.4 Toast Notifications

- Position: top-right fixed
- Auto-dismiss: 4 seconds
- Closable with X button
- Types:
  - Success: green border + icon
  - Error: red border + icon
  - Warning: yellow border + icon
- Stack: up to 5 visible, oldest dismissed first

### 4.5 Badges

| Variant | Color |
|---------|-------|
| Default | Gray text, dark bg |
| Success | Green text |
| Error | Red text |
| Warning | Yellow text |
| Accent | Red text |

### 4.6 Progress Bar

- Animated fill via Framer Motion
- Red accent fill on dark background track
- Optional percentage label

### 4.7 FileUploadZone

- Dashed border in idle state
- Full red border on drag-over
- Supports click-to-open fallback
- Shows accepted formats + max size
- Error state with message

---

## 5. Motion

- Library: **Framer Motion**
- Speed: 150–250ms
- Easing: ease-in-out
- Allowed patterns:
  - Fade + translate-y (page/element mount)
  - Scale hover (buttons, cards)
  - Progressive reveal (list items stagger)
  - Width animation (progress bars)
- Forbidden: bounce, elastic, transitions > 300ms, decorative-only

---

## 6. UX Principles

- Interface MUST always show current state (idle, loading, done, error)
- Every error MUST be visible — toast + inline message + never silent failure
- Processing MUST be cancellable where applicable (FrameExtractor)
- No data leaves the browser — privacy-first messaging in UI
- Tools work offline after initial load

---

## 7. Responsiveness

- Desktop-first (primary use)
- Tablet: supported
- Mobile: limited (view only)
- Tool grid: 1 col (mobile) → 2 col (tablet) → 3 col (desktop)
- BubbleMenu: collapses to icon-only on mobile

---

## 8. Performance UX

- Skeleton loading for async operations (thumbnail generation, frame extraction)
- Progress bars for batch operations
- Cancellation support for long-running operations
- `URL.createObjectURL()` + revoke after use — no memory leaks
- Canvas elements created off-screen, disposed after use

---

## 9. State Management

- No global state (no Redux, no Context)
- Tool state: component-local `useState` + custom hooks
- No persistence (no localStorage, no sessionStorage)
- Each tool is fully stateless between visits — intentional

---

## 10. Accessibility

- All interactive elements keyboard-accessible
- Focus indicators visible (accent glow)
- ARIA labels on icon-only buttons
- File inputs have descriptive labels
- Error messages linked to inputs via `aria-describedby`

---

END OF SYSTEM DESIGN
