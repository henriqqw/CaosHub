import { useState, useCallback } from 'react'
import { generateId } from '../../../lib/utils'
import { renderThumbnail } from '../utils/renderThumbnail'

export interface PdfFile {
  id: string
  name: string
  size: number
  buffer: ArrayBuffer
  thumbnail: string | null
}

export function usePdfFiles() {
  const [files, setFiles] = useState<PdfFile[]>([])

  const addFiles = useCallback(async (newFiles: File[]) => {
    const entries: PdfFile[] = await Promise.all(
      newFiles.map(async file => {
        const buffer = await file.arrayBuffer()
        return {
          id: generateId(),
          name: file.name,
          size: file.size,
          buffer,
          thumbnail: null,
        }
      }),
    )

    setFiles(prev => [...prev, ...entries])

    // Generate thumbnails asynchronously
    entries.forEach(async entry => {
      try {
        const thumbnail = await renderThumbnail(entry.buffer)
        setFiles(prev =>
          prev.map(f => (f.id === entry.id ? { ...f, thumbnail } : f)),
        )
      } catch {
        // thumbnail generation failed — not critical
      }
    })
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const reorder = useCallback((startIndex: number, endIndex: number) => {
    setFiles(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }, [])

  return { files, addFiles, removeFile, reorder }
}
