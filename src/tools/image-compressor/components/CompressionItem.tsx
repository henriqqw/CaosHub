import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Trash2, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { cn, formatBytes, downloadBlob, dataUrlToBlob } from '../../../lib/utils'
import type { CompressionItem as CompressionItemType } from '../hooks/useImageCompressor'

interface CompressionItemProps {
  item: CompressionItemType
  onRemove: (id: string) => void
}

export function CompressionItem({ item, onRemove }: CompressionItemProps) {
  const [showCompressed, setShowCompressed] = useState(true)
  const [originalPreview] = useState(() => URL.createObjectURL(item.file))

  const handleDownload = () => {
    if (!item.result) return
    const blob = dataUrlToBlob(item.result.dataUrl)
    const ext = item.result.dataUrl.split(';')[0].split('/')[1] ?? 'jpg'
    const baseName = item.file.name.replace(/\.[^.]+$/, '')
    downloadBlob(blob, `${baseName}-compressed.${ext}`)
  }

  const reduction =
    item.result
      ? Math.round(((item.result.originalSize - item.result.compressedSize) / item.result.originalSize) * 100)
      : 0

  const reductionPositive = reduction > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-surface border border-border rounded-xl p-4 space-y-3"
    >
      {/* Top row: filename + status + remove */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{item.file.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">{formatBytes(item.file.size)} original</p>
        </div>

        {/* Status badge */}
        {item.status === 'compressing' && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Comprimindo...
          </div>
        )}

        {item.status === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-error shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
            Erro
          </div>
        )}

        {item.status === 'done' && item.result && (
          <div
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-semibold shrink-0',
              reductionPositive
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-warning/10 text-warning border border-warning/20',
            )}
          >
            {reductionPositive ? `-${reduction}%` : `+${Math.abs(reduction)}%`}
          </div>
        )}

        <Button
          variant="ghost"
          className="w-7 h-7 p-0 shrink-0 text-text-secondary hover:text-error hover:border-error/40"
          onClick={() => onRemove(item.id)}
          title="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Error message */}
      {item.status === 'error' && item.error && (
        <p className="text-xs text-error">{item.error}</p>
      )}

      {/* Size comparison + preview toggle when done */}
      {item.status === 'done' && item.result && (
        <>
          {/* Size row */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">
              {formatBytes(item.result.originalSize)}
              <span className="text-border mx-1.5">→</span>
              <span className={cn(reductionPositive ? 'text-green-400' : 'text-warning', 'font-medium')}>
                {formatBytes(item.result.compressedSize)}
              </span>
            </span>
            <span className="text-text-secondary">
              {item.result.width}×{item.result.height}px
            </span>
          </div>

          {/* Preview toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-lg bg-bg-primary border border-border p-0.5">
                <button
                  onClick={() => setShowCompressed(false)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors duration-150',
                    !showCompressed
                      ? 'bg-accent text-white font-medium'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  <ChevronLeft className="w-3 h-3" />
                  Original
                </button>
                <button
                  onClick={() => setShowCompressed(true)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors duration-150',
                    showCompressed
                      ? 'bg-accent text-white font-medium'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  Comprimida
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <Button
                variant="ghost"
                className="h-7 px-3 text-xs gap-1.5"
                onClick={handleDownload}
              >
                <Download className="w-3 h-3" />
                Baixar
              </Button>
            </div>

            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-bg-primary border border-border">
              <img
                src={showCompressed ? item.result.dataUrl : originalPreview}
                alt={showCompressed ? 'Imagem comprimida' : 'Imagem original'}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">
                {showCompressed ? 'Comprimida' : 'Original'}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
