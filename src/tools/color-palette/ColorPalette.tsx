import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Copy, Loader2, X } from 'lucide-react'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { ColorSwatch } from './components/ColorSwatch'
import { extractColors, type ExtractedColor } from './utils/extractColors'

export function ColorPalette() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [colors, setColors] = useState<ExtractedColor[]>([])
  const [loading, setLoading] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast({ type: 'error', message: 'Selecione um arquivo de imagem válido.' })
        return
      }

      // Reset state
      setColors([])
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      setLoading(true)

      try {
        const extracted = await extractColors(file, 8)
        setColors(extracted)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao extrair cores'
        toast({ type: 'error', message: msg })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const handleCopyAll = async () => {
    if (colors.length === 0) return
    const cssVars = colors
      .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
      .join('\n')
    const cssText = `:root {\n${cssVars}\n}`
    try {
      await navigator.clipboard.writeText(cssText)
      toast({ type: 'success', message: 'Variáveis CSS copiadas para a área de transferência.' })
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = cssText
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      toast({ type: 'success', message: 'Variáveis CSS copiadas para a área de transferência.' })
    }
  }

  const handleClearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setColors([])
  }

  const handleColorCopied = (hex: string) => {
    toast({ type: 'success', message: `${hex} copiado!` })
  }

  return (
    <>
      <Helmet>
        <title>Extrator de Paleta de Cores — Extraia cores de imagens no navegador | CaosHub</title>
        <meta
          name="description"
          content="Extraia paletas de cores de qualquer imagem direto no navegador. Obtenha os valores hex e RGB das cores dominantes, copie como variáveis CSS."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/color-palette" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/color-palette" />
        <meta property="og:title" content="Extrator de Paleta de Cores — CaosHub" />
        <meta
          property="og:description"
          content="Extraia paletas de cores de qualquer imagem direto no navegador. Valores hex, RGB e export como variáveis CSS."
        />
        <meta name="twitter:title" content="Extrator de Paleta de Cores — CaosHub" />
        <meta
          name="twitter:description"
          content="Extraia paletas de cores de qualquer imagem direto no navegador. Valores hex, RGB e export como variáveis CSS."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 pb-12 space-y-6"
      >
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
            <Palette className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Extrator de Paleta</h1>
            <p className="text-text-secondary text-sm mt-1">
              Carregue uma imagem e extraia as cores dominantes com valores hex e RGB.
            </p>
          </div>
        </div>

        {/* Upload zone — hide when image loaded */}
        {!imagePreview && (
          <FileUploadZone
            accept={['image/*', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']}
            multiple={false}
            onFiles={handleFiles}
            label="Arraste uma imagem aqui ou clique para selecionar"
            hint="JPEG, PNG, WebP, GIF, BMP — uma imagem por vez"
          />
        )}

        {/* Image preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-xl overflow-hidden border border-border bg-bg-secondary">
                <img
                  src={imagePreview}
                  alt="Imagem carregada"
                  className="w-full max-h-64 object-contain"
                />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-text-primary text-sm font-medium">
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      Extraindo cores...
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleClearImage}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-primary/80 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors duration-150 backdrop-blur-sm"
                title="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Color grid */}
        <AnimatePresence>
          {colors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Section header */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {colors.length} {colors.length === 1 ? 'cor extraída' : 'cores extraídas'}
                </p>
                <Button
                  variant="ghost"
                  className="h-8 px-3 text-xs gap-1.5"
                  onClick={handleCopyAll}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar como variáveis CSS
                </Button>
              </div>

              {/* Swatches grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {colors.map(color => (
                  <ColorSwatch
                    key={color.hex}
                    color={color}
                    onCopied={handleColorCopied}
                  />
                ))}
              </div>

              {/* CSS preview */}
              <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface">
                  <span className="text-xs font-mono text-text-secondary">CSS Variables</span>
                  <button
                    onClick={handleCopyAll}
                    className="text-xs text-text-secondary hover:text-accent transition-colors duration-150 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                </div>
                <div className="px-4 py-3 font-mono text-xs text-text-secondary leading-relaxed">
                  <span className="text-accent">:root</span>
                  <span className="text-text-primary"> {'{'}</span>
                  {colors.map((c, i) => (
                    <div key={c.hex} className="pl-4">
                      <span className="text-text-secondary">--color-{i + 1}: </span>
                      <span className="font-semibold" style={{ color: c.hex }}>
                        {c.hex}
                      </span>
                      <span className="text-text-secondary">;</span>
                    </div>
                  ))}
                  <span className="text-text-primary">{'}'}</span>
                </div>
              </div>

              {/* New image button */}
              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={handleClearImage}
              >
                Carregar outra imagem
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
