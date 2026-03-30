import { useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { renderPdfPages, type PageImage, type ImageFormat } from '../utils/pdfToImages'

type Phase = 'idle' | 'loaded' | 'rendering' | 'done'

export interface UsePdfToImagesReturn {
  phase: Phase
  pdfFile: File | null
  pageCount: number
  selectedPages: number[]
  format: ImageFormat
  quality: number
  scale: number
  progress: number
  images: PageImage[]
  loadPdf: (file: File) => Promise<void>
  togglePage: (n: number) => void
  selectAll: () => void
  selectNone: () => void
  setFormat: (f: ImageFormat) => void
  setQuality: (q: number) => void
  setScale: (s: number) => void
  render: () => Promise<void>
  reset: () => void
}

export function usePdfToImages(): UsePdfToImagesReturn {
  const [phase, setPhase] = useState<Phase>('idle')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [format, setFormat] = useState<ImageFormat>('png')
  const [quality, setQuality] = useState(0.9)
  const [scale, setScale] = useState(2)
  const [progress, setProgress] = useState(0)
  const [images, setImages] = useState<PageImage[]>([])

  const loadPdf = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const count = pdf.numPages
    const allPages = Array.from({ length: count }, (_, i) => i + 1)

    setPdfFile(file)
    setPageCount(count)
    setSelectedPages(allPages)
    setProgress(0)
    setImages([])
    setPhase('loaded')
  }, [])

  const togglePage = useCallback((n: number) => {
    setSelectedPages(prev =>
      prev.includes(n)
        ? prev.filter(p => p !== n)
        : [...prev, n].sort((a, b) => a - b),
    )
  }, [])

  const selectAll = useCallback(() => {
    setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1))
  }, [pageCount])

  const selectNone = useCallback(() => {
    setSelectedPages([])
  }, [])

  const render = useCallback(async () => {
    if (!pdfFile || selectedPages.length === 0) return
    setPhase('rendering')
    setProgress(0)
    setImages([])

    try {
      const result = await renderPdfPages(
        pdfFile,
        format,
        quality,
        scale,
        selectedPages,
        (current, total) => {
          setProgress(Math.round((current / total) * 100))
        },
      )
      setImages(result)
      setProgress(100)
      setPhase('done')
    } catch (err) {
      setPhase('loaded')
      setProgress(0)
      throw err
    }
  }, [pdfFile, selectedPages, format, quality, scale])

  const reset = useCallback(() => {
    setPhase('idle')
    setPdfFile(null)
    setPageCount(0)
    setSelectedPages([])
    setFormat('png')
    setQuality(0.9)
    setScale(2)
    setProgress(0)
    setImages([])
  }, [])

  return {
    phase,
    pdfFile,
    pageCount,
    selectedPages,
    format,
    quality,
    scale,
    progress,
    images,
    loadPdf,
    togglePage,
    selectAll,
    selectNone,
    setFormat,
    setQuality,
    setScale,
    render,
    reset,
  }
}
