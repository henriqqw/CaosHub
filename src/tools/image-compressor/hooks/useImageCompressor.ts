import { useState, useCallback, useEffect, useRef } from 'react'
import { generateId } from '../../../lib/utils'
import { compressImage, type CompressResult, type CompressFormat } from '../utils/compressImage'

export interface CompressionItem {
  id: string
  file: File
  status: 'pending' | 'compressing' | 'done' | 'error'
  result?: CompressResult
  error?: string
}

export function useImageCompressor() {
  const [items, setItems] = useState<CompressionItem[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const compressItem = useCallback(
    async (id: string, file: File, format: CompressFormat, quality: number) => {
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, status: 'compressing' as const } : item)),
      )
      try {
        const result = await compressImage(file, format, quality)
        setItems(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status: 'done' as const, result, error: undefined } : item,
          ),
        )
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Erro ao comprimir imagem'
        setItems(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status: 'error' as const, error } : item,
          ),
        )
      }
    },
    [],
  )

  const addFiles = useCallback(
    (files: File[], format: CompressFormat, quality: number) => {
      const newItems: CompressionItem[] = files.map(file => ({
        id: generateId(),
        file,
        status: 'pending' as const,
      }))

      setItems(prev => [...prev, ...newItems])

      // Compress each new item immediately
      for (const item of newItems) {
        compressItem(item.id, item.file, format, quality)
      }
    },
    [compressItem],
  )

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const recompressAll = useCallback(
    (format: CompressFormat, quality: number, currentItems: CompressionItem[]) => {
      if (currentItems.length === 0) return

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        for (const item of currentItems) {
          compressItem(item.id, item.file, format, quality)
        }
      }, 300)
    },
    [compressItem],
  )

  const clearAll = useCallback(() => {
    setItems([])
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return { items, addFiles, removeItem, recompressAll, clearAll }
}
