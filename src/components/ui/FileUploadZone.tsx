import { cn } from '../../lib/utils'
import { useFileUpload } from '../../hooks/useFileUpload'
import { Upload } from 'lucide-react'

interface FileUploadZoneProps {
  accept?: string[]
  multiple?: boolean
  maxSize?: number
  onFiles: (files: File[]) => void
  label?: string
  hint?: string
  className?: string
}

export function FileUploadZone({
  accept,
  multiple = false,
  maxSize,
  onFiles,
  label,
  hint,
  className,
}: FileUploadZoneProps) {
  const { isDragging, error, inputRef, handleDragOver, handleDragLeave, handleDrop, handleChange, open } =
    useFileUpload({ accept, multiple, maxSize })

  return (
    <div className={cn('space-y-1', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, onFiles)}
        onClick={open}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-150',
          isDragging
            ? 'border-accent bg-accent/5'
            : error
              ? 'border-error bg-error/5'
              : 'border-border bg-bg-secondary hover:border-accent/50 hover:bg-surface',
        )}
      >
        <Upload
          className={cn(
            'w-8 h-8 transition-colors duration-150',
            isDragging ? 'text-accent' : error ? 'text-error' : 'text-text-secondary',
          )}
        />
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            {label ?? 'Drop files here or click to browse'}
          </p>
          {hint && <p className="text-xs text-text-secondary mt-1">{hint}</p>}
        </div>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept?.join(',')}
        multiple={multiple}
        className="hidden"
        onChange={e => handleChange(e, onFiles)}
      />
    </div>
  )
}
