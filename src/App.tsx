import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'

const MergePDF = lazy(() => import('./tools/merge-pdf/MergePDF').then(m => ({ default: m.MergePDF })))
const FrameExtractor = lazy(() => import('./tools/frame-extractor/FrameExtractor').then(m => ({ default: m.FrameExtractor })))
const WebPConverter = lazy(() => import('./tools/webp-converter/WebPConverter').then(m => ({ default: m.WebPConverter })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/tools/merge-pdf" element={<Suspense fallback={<PageLoader />}><MergePDF /></Suspense>} />
          <Route path="/tools/frame-extractor" element={<Suspense fallback={<PageLoader />}><FrameExtractor /></Suspense>} />
          <Route path="/tools/webp-converter" element={<Suspense fallback={<PageLoader />}><WebPConverter /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
