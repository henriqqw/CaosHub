import { Download, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { type ConversionItem } from '../hooks/useWebPConverter'
import { formatBytes, downloadBlob, dataUrlToBlob } from '../../../lib/utils'
import { Badge } from '../../../components/ui/Badge'

interface ConversionListProps {
  items: ConversionItem[]
  onRemove: (id: string) => void
}

export function ConversionList({ items, onRemove }: ConversionListProps) {
  const downloadOne = (item: ConversionItem) => {
    if (!item.webpDataUrl) return
    const blob = dataUrlToBlob(item.webpDataUrl)
    const name = item.file.name.replace(/\.[^.]+$/, '') + '.webp'
    downloadBlob(blob, name)
  }

  return (
    <div className="space-y-2">
      {items.map(item => {
        const savings =
          item.webpSize != null
            ? Math.round((1 - item.webpSize / item.originalSize) * 100)
            : null

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface"
          >
            {/* Status icon */}
            <div className="shrink-0">
              {item.status === 'converting' && (
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              )}
              {item.status === 'done' && (
                <CheckCircle className="w-4 h-4 text-success" />
              )}
              {item.status === 'error' && (
                <AlertCircle className="w-4 h-4 text-error" />
              )}
              {item.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-border" />
              )}
            </div>

            {/* Preview */}
            {item.webpDataUrl && (
              <img
                src={item.webpDataUrl}
                alt={item.file.name}
                className="w-10 h-10 rounded object-cover border border-border shrink-0"
              />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{item.file.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-text-secondary">{formatBytes(item.originalSize)}</span>
                {item.webpSize != null && (
                  <>
                    <span className="text-xs text-text-secondary">→</span>
                    <span className="text-xs text-text-secondary">{formatBytes(item.webpSize)}</span>
                    {savings != null && savings > 0 && (
                      <Badge variant="success">{savings}% smaller</Badge>
                    )}
                    {savings != null && savings <= 0 && (
                      <Badge variant="warning">{Math.abs(savings)}% larger</Badge>
                    )}
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
                  title="Download WebP"
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
        )
      })}
    </div>
  )
}
