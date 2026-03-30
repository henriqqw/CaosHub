import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'

interface UseFileUploadOptions {
  accept?: string[]
  multiple?: boolean
  maxSize?: number
}

export function useFileUpload({ accept, multiple = false, maxSize }: UseFileUploadOptions) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = useCallback((files: File[]): File[] | null => {
    const target = multiple ? files : [files[0]]
    for (const file of target) {
      if (accept && accept.length > 0) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        const mime = file.type
        const ok = accept.some(a => a === ext || a === mime || a === mime.split('/')[0] + '/*')
        if (!ok) {
          setError(`File type not allowed: ${file.name}`)
          return null
        }
      }
      if (maxSize && file.size > maxSize) {
        setError(`File too large: ${file.name}`)
        return null
      }
    }
    setError(null)
    return target
  }, [accept, maxSize, multiple])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent, onFiles: (files: File[]) => void) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return
    const valid = validate(files)
    if (valid) onFiles(valid)
  }, [validate])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>, onFiles: (files: File[]) => void) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const valid = validate(files)
    if (valid) onFiles(valid)
    if (inputRef.current) inputRef.current.value = ''
  }, [validate])

  const open = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return { isDragging, error, inputRef, handleDragOver, handleDragLeave, handleDrop, handleChange, open }
}
