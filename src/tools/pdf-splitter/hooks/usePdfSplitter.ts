import { useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import {
  splitAllPages,
  splitByRanges,
  extractPages,
  type SplitResult,
} from '../utils/splitPdf'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

export type SplitMode = 'all' | 'range' | 'custom'
export type Phase = 'idle' | 'loaded' | 'splitting' | 'done'

export interface UsePdfSplitterReturn {
  phase: Phase
  pdfFile: File | null
  pageCount: number
  buffer: ArrayBuffer | null
  splitMode: SplitMode
  chunkSize: number
  selectedPages: number[]
  results: SplitResult[]
  splitting: boolean
  loadPdf: (file: File) => Promise<void>
  setSplitMode: (mode: SplitMode) => void
  setChunkSize: (n: number) => void
  togglePage: (n: number) => void
  split: () => Promise<void>
  reset: () => void
}

export function usePdfSplitter(): UsePdfSplitterReturn {
  const [phase, setPhase] = useState<Phase>('idle')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null)
  const [splitMode, setSplitMode] = useState<SplitMode>('all')
  const [chunkSize, setChunkSize] = useState(1)
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [results, setResults] = useState<SplitResult[]>([])
  const [splitting, setSplitting] = useState(false)

  const loadPdf = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise
    const count = pdf.numPages

    setPdfFile(file)
    setBuffer(arrayBuffer)
    setPageCount(count)
    setSelectedPages([])
    setResults([])
    setPhase('loaded')
  }, [])

  const togglePage = useCallback((n: number) => {
    setSelectedPages(prev =>
      prev.includes(n)
        ? prev.filter(p => p !== n)
        : [...prev, n].sort((a, b) => a - b),
    )
  }, [])

  const split = useCallback(async () => {
    if (!buffer || !pdfFile) return
    setSplitting(true)
    setPhase('splitting')

    const basename = pdfFile.name.replace(/\.pdf$/i, '')

    try {
      let splitResults: SplitResult[] = []

      if (splitMode === 'all') {
        splitResults = await splitAllPages(buffer, basename)
      } else if (splitMode === 'range') {
        const safeChunk = Math.max(1, Math.min(chunkSize, pageCount))
        const ranges: [number, number][] = []
        for (let i = 0; i < pageCount; i += safeChunk) {
          const end = Math.min(i + safeChunk - 1, pageCount - 1)
          ranges.push([i, end])
        }
        splitResults = await splitByRanges(buffer, ranges, basename)
      } else {
        // custom: extract selectedPages (convert to 0-indexed)
        if (selectedPages.length === 0) {
          setSplitting(false)
          setPhase('loaded')
          return
        }
        const indices = selectedPages.map(p => p - 1)
        const result = await extractPages(buffer, indices, `${basename}-selecao.pdf`)
        splitResults = [result]
      }

      setResults(splitResults)
      setPhase('done')
    } catch (err) {
      setPhase('loaded')
      throw err
    } finally {
      setSplitting(false)
    }
  }, [buffer, pdfFile, splitMode, chunkSize, pageCount, selectedPages])

  const reset = useCallback(() => {
    setPhase('idle')
    setPdfFile(null)
    setPageCount(0)
    setBuffer(null)
    setSplitMode('all')
    setChunkSize(1)
    setSelectedPages([])
    setResults([])
    setSplitting(false)
  }, [])

  return {
    phase,
    pdfFile,
    pageCount,
    buffer,
    splitMode,
    chunkSize,
    selectedPages,
    results,
    splitting,
    loadPdf,
    setSplitMode,
    setChunkSize,
    togglePage,
    split,
    reset,
  }
}
