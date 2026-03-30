import { useState, useCallback } from 'react'
import { generateId } from '../../../lib/utils'
import { convertToWebP } from '../utils/convertToWebP'

export interface ConversionItem {
  id: string
  file: File
  originalSize: number
  webpDataUrl: string | null
  webpSize: number | null
  status: 'pending' | 'converting' | 'done' | 'error'
  error: string | null
}

export function useWebPConverter() {
  const [items, setItems] = useState<ConversionItem[]>([])
  const [quality, setQuality] = useState(0.85)

  const addFiles = useCallback(async (files: File[]) => {
    const newItems: ConversionItem[] = files.map(file => ({
      id: generateId(),
      file,
      originalSize: file.size,
      webpDataUrl: null,
      webpSize: null,
      status: 'pending',
      error: null,
    }))

    setItems(prev => [...prev, ...newItems])

    // Convert each immediately
    for (const item of newItems) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'converting' } : i))
      try {
        const result = await convertToWebP(item.file, quality)
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'done', webpDataUrl: result.dataUrl, webpSize: result.size }
              : i,
          ),
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
    }
  }, [quality])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const reconvertAll = useCallback(async () => {
    const doneItems = items.filter(i => i.status === 'done' || i.status === 'error')
    if (!doneItems.length) return

    setItems(prev => prev.map(i => ({ ...i, status: 'converting', webpDataUrl: null, webpSize: null, error: null })))

    for (const item of doneItems) {
      try {
        const result = await convertToWebP(item.file, quality)
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'done', webpDataUrl: result.dataUrl, webpSize: result.size }
              : i,
          ),
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
    }
  }, [items, quality])

  return { items, quality, setQuality, addFiles, removeItem, reconvertAll }
}
