import { Download, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { type ConversionItem } from '../hooks/useImageConverter'
import { type OutputFormat, formatExt } from '../utils/convertImage'
import { formatBytes, downloadBlob, dataUrlToBlob } from '../../../lib/utils'
import { Badge } from '../../../components/ui/Badge'

interface ConversionListProps {
  items: ConversionItem[]
  outputFormat: OutputFormat
  onRemove: (id: string) => void
}

function getSavingsBadge(originalSize: number, newSize: number) {
  const diff = Math.round((1 - newSize / originalSize) * 100)
  if (diff > 0) return <Badge variant="success">{diff}% smaller</Badge>
  if (diff < 0) return <Badge variant="warning">{Math.abs(diff)}% larger</Badge>
  return null
}

export function ConversionList({ items, outputFormat, onRemove }: ConversionListProps) {
  const ext = formatExt(outputFormat)

  const downloadOne = (item: ConversionItem) => {
    if (!item.result) return
    const blob = dataUrlToBlob(item.result.dataUrl)
    const name = item.file.name.replace(/\.[^.]+$/, '') + '.' + ext
    downloadBlob(blob, name)
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface"
        >
          {/* Status icon */}
          <div className="shrink-0 w-5 flex justify-center">
            {item.status === 'converting' && (
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
            )}
            {item.status === 'done' && <CheckCircle className="w-4 h-4 text-success" />}
            {item.status === 'error' && <AlertCircle className="w-4 h-4 text-error" />}
            {item.status === 'pending' && (
              <div className="w-4 h-4 rounded-full border-2 border-border" />
            )}
          </div>

          {/* Preview thumbnail */}
          {item.result && (
            <img
              src={item.result.dataUrl}
              alt={item.file.name}
              className="w-10 h-10 rounded object-cover border border-border shrink-0"
            />
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{item.file.name}</p>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
              <span className="text-xs text-text-secondary">{formatBytes(item.originalSize)}</span>
              {item.result && (
                <>
                  <span className="text-xs text-text-secondary">→ {formatBytes(item.result.size)}</span>
                  {getSavingsBadge(item.originalSize, item.result.size)}
                  <span className="text-xs text-text-secondary">
                    {item.result.width}×{item.result.height}
                  </span>
                </>
              )}
              {item.error && (
                <span className="text-xs text-error">{item.error}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {item.status === 'done' && (
              <button
                onClick={() => downloadOne(item)}
                className="p-1.5 text-text-secondary hover:text-accent transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onRemove(item.id)}
              className="p-1.5 text-text-secondary hover:text-error transition-colors"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
