import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { ExtractedColor } from '../utils/extractColors'

interface ColorSwatchProps {
  color: ExtractedColor
  onCopied: (hex: string) => void
}

export function ColorSwatch({ color, onCopied }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(color.hex)
      setCopied(true)
      onCopied(color.hex)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = color.hex
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      onCopied(color.hex)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  // Determine if text on the swatch should be light or dark
  const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b
  const isLight = luminance > 160

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/40 transition-colors duration-150"
    >
      {/* Color swatch */}
      <div
        className="w-full h-16 relative cursor-pointer group"
        style={{ backgroundColor: color.hex }}
        onClick={handleCopy}
        title={`Copiar ${color.hex}`}
      >
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            isLight ? 'bg-black/10' : 'bg-white/10',
          )}
        >
          {copied ? (
            <Check className={cn('w-5 h-5', isLight ? 'text-black/70' : 'text-white/80')} />
          ) : (
            <Copy className={cn('w-5 h-5', isLight ? 'text-black/70' : 'text-white/80')} />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-mono font-semibold text-text-primary tracking-wide">
            {color.hex}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              'p-1 rounded transition-colors duration-150',
              copied
                ? 'text-green-400'
                : 'text-text-secondary hover:text-text-primary',
            )}
            title="Copiar hex"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-xs text-text-secondary font-mono">{color.rgb}</p>

        {/* Percentage bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Predominância</span>
            <span className="text-xs font-medium text-text-primary">{color.percentage}%</span>
          </div>
          <div className="h-1 rounded-full bg-bg-primary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${color.percentage}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: color.hex }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
