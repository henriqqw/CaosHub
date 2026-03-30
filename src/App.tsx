import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'

// ── PDF ───────────────────────────────────────────────────────────────────────
const MergePDF         = lazy(() => import('./tools/merge-pdf/MergePDF').then(m => ({ default: m.MergePDF })))
const PdfToImages      = lazy(() => import('./tools/pdf-to-images/PdfToImages').then(m => ({ default: m.PdfToImages })))
const PdfSplitter      = lazy(() => import('./tools/pdf-splitter/PdfSplitter').then(m => ({ default: m.PdfSplitter })))
const PdfProtect       = lazy(() => import('./tools/pdf-protect/PdfProtect').then(m => ({ default: m.PdfProtect })))

// ── Imagem ────────────────────────────────────────────────────────────────────
const ImageConverter   = lazy(() => import('./tools/image-converter/ImageConverter').then(m => ({ default: m.ImageConverter })))
const ImageCompressor  = lazy(() => import('./tools/image-compressor/ImageCompressor').then(m => ({ default: m.ImageCompressor })))
const ColorPalette     = lazy(() => import('./tools/color-palette/ColorPalette').then(m => ({ default: m.ColorPalette })))
const BackgroundRemoval= lazy(() => import('./tools/background-removal/BackgroundRemoval').then(m => ({ default: m.BackgroundRemoval })))
const ImageEditor      = lazy(() => import('./tools/image-editor/ImageEditor').then(m => ({ default: m.ImageEditor })))
const FaviconGenerator = lazy(() => import('./tools/favicon-generator/FaviconGenerator').then(m => ({ default: m.FaviconGenerator })))

// ── Vídeo / Áudio ─────────────────────────────────────────────────────────────
const FrameExtractor   = lazy(() => import('./tools/frame-extractor/FrameExtractor').then(m => ({ default: m.FrameExtractor })))
const VideoConverter   = lazy(() => import('./tools/video-converter/VideoConverter').then(m => ({ default: m.VideoConverter })))
const VideoTrimmer     = lazy(() => import('./tools/video-trimmer/VideoTrimmer').then(m => ({ default: m.VideoTrimmer })))
const AudioConverter   = lazy(() => import('./tools/audio-converter/AudioConverter').then(m => ({ default: m.AudioConverter })))

// ── Texto ─────────────────────────────────────────────────────────────────────
const CharacterCounter = lazy(() => import('./tools/character-counter/CharacterCounter').then(m => ({ default: m.CharacterCounter })))
const MarkdownPreview  = lazy(() => import('./tools/markdown-preview/MarkdownPreview').then(m => ({ default: m.MarkdownPreview })))

// ── Utilidade ─────────────────────────────────────────────────────────────────
const QRCodeTool       = lazy(() => import('./tools/qr-code/QRCodeTool').then(m => ({ default: m.QRCodeTool })))
const PasswordGenerator= lazy(() => import('./tools/password-generator/PasswordGenerator').then(m => ({ default: m.PasswordGenerator })))

// ── Dev ───────────────────────────────────────────────────────────────────────
const JsonFormatter    = lazy(() => import('./tools/json-formatter/JsonFormatter').then(m => ({ default: m.JsonFormatter })))
const HashGenerator    = lazy(() => import('./tools/hash-generator/HashGenerator').then(m => ({ default: m.HashGenerator })))
const JwtDecoder       = lazy(() => import('./tools/jwt-decoder/JwtDecoder').then(m => ({ default: m.JwtDecoder })))
const UuidGenerator    = lazy(() => import('./tools/uuid-generator/UuidGenerator').then(m => ({ default: m.UuidGenerator })))
const Encoder          = lazy(() => import('./tools/encoder/Encoder').then(m => ({ default: m.Encoder })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />

          {/* PDF */}
          <Route path="/tools/merge-pdf"          element={<S><MergePDF /></S>} />
          <Route path="/tools/pdf-to-images"      element={<S><PdfToImages /></S>} />
          <Route path="/tools/pdf-splitter"       element={<S><PdfSplitter /></S>} />
          <Route path="/tools/pdf-protect"        element={<S><PdfProtect /></S>} />

          {/* Imagem */}
          <Route path="/tools/image-converter"    element={<S><ImageConverter /></S>} />
          <Route path="/tools/image-compressor"   element={<S><ImageCompressor /></S>} />
          <Route path="/tools/color-palette"      element={<S><ColorPalette /></S>} />
          <Route path="/tools/background-removal" element={<S><BackgroundRemoval /></S>} />
          <Route path="/tools/image-editor"       element={<S><ImageEditor /></S>} />
          <Route path="/tools/favicon-generator"  element={<S><FaviconGenerator /></S>} />

          {/* Vídeo / Áudio */}
          <Route path="/tools/frame-extractor"    element={<S><FrameExtractor /></S>} />
          <Route path="/tools/video-converter"    element={<S><VideoConverter /></S>} />
          <Route path="/tools/video-trimmer"      element={<S><VideoTrimmer /></S>} />
          <Route path="/tools/audio-converter"    element={<S><AudioConverter /></S>} />

          {/* Texto */}
          <Route path="/tools/character-counter"  element={<S><CharacterCounter /></S>} />
          <Route path="/tools/markdown-preview"   element={<S><MarkdownPreview /></S>} />

          {/* Utilidade */}
          <Route path="/tools/qr-code"            element={<S><QRCodeTool /></S>} />
          <Route path="/tools/password-generator" element={<S><PasswordGenerator /></S>} />

          {/* Dev */}
          <Route path="/tools/json-formatter"     element={<S><JsonFormatter /></S>} />
          <Route path="/tools/hash-generator"     element={<S><HashGenerator /></S>} />
          <Route path="/tools/jwt-decoder"        element={<S><JwtDecoder /></S>} />
          <Route path="/tools/uuid-generator"     element={<S><UuidGenerator /></S>} />
          <Route path="/tools/encoder"            element={<S><Encoder /></S>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
