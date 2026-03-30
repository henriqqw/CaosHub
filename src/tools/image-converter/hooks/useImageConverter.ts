import { useState, useCallback, useRef } from 'react'
import { generateId } from '../../../lib/utils'
import { convertImage, type OutputFormat } from '../utils/convertImage'

export interface ConversionItem {
  id: string
  file: File
  originalSize: number
  result: { dataUrl: string; size: number; width: number; height: number } | null
  status: 'pending' | 'converting' | 'done' | 'error'
  error: string | null
}

export function useImageConverter() {
  const [items, setItems] = useState<ConversionItem[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('webp')
  const [quality, setQuality] = useState(0.85)
  // Keep latest format/quality accessible in callbacks without re-creating them
  const formatRef = useRef(outputFormat)
  const qualityRef = useRef(quality)
  formatRef.current = outputFormat
  qualityRef.current = quality

  const convertItem = useCallback(async (item: ConversionItem, fmt: OutputFormat, q: number) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'converting', result: null, error: null } : i))
    try {
      const result = await convertImage(item.file, fmt, q)
      setItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, status: 'done', result } : i),
      )
    } catch (e) {
      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'error', error: e instanceof Error ? e.message : 'Conversion failed' }
            : i,
        ),
      )
    }
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    const newItems: ConversionItem[] = files.map(file => ({
      id: generateId(),
      file,
      originalSize: file.size,
      result: null,
      status: 'pending',
      error: null,
    }))
    setItems(prev => [...prev, ...newItems])
    for (const item of newItems) {
      await convertItem(item, formatRef.current, qualityRef.current)
    }
  }, [convertItem])

  const reconvertAll = useCallback(async (fmt: OutputFormat, q: number) => {
    const current = items.filter(i => i.status === 'done' || i.status === 'error')
    for (const item of current) {
      await convertItem(item, fmt, q)
    }
  }, [items, convertItem])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const handleFormatChange = useCallback((fmt: OutputFormat) => {
    setOutputFormat(fmt)
    reconvertAll(fmt, qualityRef.current)
  }, [reconvertAll])

  const handleQualityChange = useCallback((q: number) => {
    setQuality(q)
    reconvertAll(formatRef.current, q)
  }, [reconvertAll])

  return {
    items,
    outputFormat,
    quality,
    addFiles,
    removeItem,
    setOutputFormat: handleFormatChange,
    setQuality: handleQualityChange,
  }
}
