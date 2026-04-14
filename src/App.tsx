import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'

// ── PDF ───────────────────────────────────────────────────────────────────────
const MergePDF         = lazy(() => import('./tools/merge-pdf/MergePDF').then(m => ({ default: m.MergePDF })))
const PdfConverter     = lazy(() => import('./tools/pdf-converter/PdfConverter').then(m => ({ default: m.PdfConverter })))

// ── Imagem ────────────────────────────────────────────────────────────────────
const ImageConverter   = lazy(() => import('./tools/image-converter/ImageConverter').then(m => ({ default: m.ImageConverter })))
const ImageCompressor  = lazy(() => import('./tools/image-compressor/ImageCompressor').then(m => ({ default: m.ImageCompressor })))
const BackgroundRemoval= lazy(() => import('./tools/background-removal/BackgroundRemoval').then(m => ({ default: m.BackgroundRemoval })))

// ── Vídeo / Áudio ─────────────────────────────────────────────────────────────
const VideoConverter   = lazy(() => import('./tools/video-converter/VideoConverter').then(m => ({ default: m.VideoConverter })))
const AudioConverter   = lazy(() => import('./tools/audio-converter/AudioConverter').then(m => ({ default: m.AudioConverter })))
const MediaDownloader  = lazy(() => import('./tools/media-downloader/MediaDownloader').then(m => ({ default: m.MediaDownloader })))
const Transcriber      = lazy(() => import('./tools/transcriber/Transcriber').then(m => ({ default: m.Transcriber })))

// ── Utilidade ─────────────────────────────────────────────────────────────────
const QRCodeTool       = lazy(() => import('./tools/qr-code/QRCodeTool').then(m => ({ default: m.QRCodeTool })))
const PasswordGenerator= lazy(() => import('./tools/password-generator/PasswordGenerator').then(m => ({ default: m.PasswordGenerator })))

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
          <Route path="/tools/pdf-converter"      element={<S><PdfConverter /></S>} />

          {/* Imagem */}
          <Route path="/tools/image-converter"    element={<S><ImageConverter /></S>} />
          <Route path="/tools/image-compressor"   element={<S><ImageCompressor /></S>} />
          <Route path="/tools/background-removal" element={<S><BackgroundRemoval /></S>} />

          {/* Vídeo / Áudio */}
          <Route path="/tools/video-converter"    element={<S><VideoConverter /></S>} />
          <Route path="/tools/audio-converter"    element={<S><AudioConverter /></S>} />
          <Route path="/tools/media-downloader"   element={<S><MediaDownloader /></S>} />
          <Route path="/tools/transcriber"        element={<S><Transcriber /></S>} />

          {/* Utilidade */}
          <Route path="/tools/qr-code"            element={<S><QRCodeTool /></S>} />
          <Route path="/tools/password-generator" element={<S><PasswordGenerator /></S>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
