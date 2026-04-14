import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Download, Loader2, QrCode } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, downloadBlob } from '../../lib/utils'
import { generateQRDataUrl, generateQRSvgString, type QROptions } from './utils/generateQR'

const MAX_CHARS = 500

const DEFAULT_OPTIONS: QROptions = {
  size: 256,
  errorLevel: 'M',
  margin: 2,
  darkColor: '#000000',
  lightColor: '#FFFFFF',
}

const ERROR_LEVELS: { value: QROptions['errorLevel']; label: string; pct: string }[] = [
  { value: 'L', label: 'L', pct: '7%' },
  { value: 'M', label: 'M', pct: '15%' },
  { value: 'Q', label: 'Q', pct: '25%' },
  { value: 'H', label: 'H', pct: '30%' },
]

const SIZES: { value: number; label: string }[] = [
  { value: 128, label: '128px' },
  { value: 256, label: '256px' },
  { value: 512, label: '512px' },
]

export function QRCodeTool() {
  const [text, setText] = useState('')
  const [options, setOptions] = useState<QROptions>(DEFAULT_OPTIONS)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl(null)
      setError(null)
      return
    }

    if (text.length > MAX_CHARS) {
      setError(`Texto muito longo. Máximo: ${MAX_CHARS} caracteres.`)
      setDataUrl(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setIsGenerating(true)
      setError(null)
      try {
        const url = await generateQRDataUrl(text, options)
        setDataUrl(url)
      } catch {
        setError('Erro ao gerar QR code. Tente novamente.')
        setDataUrl(null)
      } finally {
        setIsGenerating(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [text, options])

  async function handleDownloadPng() {
    if (!dataUrl) return
    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      downloadBlob(blob, 'qrcode.png')
      toast({ type: 'success', message: 'PNG baixado com sucesso!' })
    } catch {
      toast({ type: 'error', message: 'Erro ao baixar PNG.' })
    }
  }

  async function handleDownloadSvg() {
    if (!text.trim()) return
    try {
      const svgStr = await generateQRSvgString(text, options)
      const blob = new Blob([svgStr], { type: 'image/svg+xml' })
      downloadBlob(blob, 'qrcode.svg')
      toast({ type: 'success', message: 'SVG baixado com sucesso!' })
    } catch {
      toast({ type: 'error', message: 'Erro ao baixar SVG.' })
    }
  }

  const charCount = text.length
  const isOverLimit = charCount > MAX_CHARS
  const hasContent = text.trim().length > 0 && !isOverLimit

  return (
    <>
      <Helmet>
        <title>Gerador de QR Code — Crie QR codes online grátis | CaosHub</title>
        <meta name="description" content="Gere QR codes de links, textos e emails direto no navegador, sem upload. Baixe em PNG ou SVG com configurações personalizadas. 100% gratuito." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/qr-code" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/qr-code" />
        <meta property="og:site_name" content="CaosHub" />
        <meta property="og:title" content="Gerador de QR Code — Crie QR codes online grátis | CaosHub" />
        <meta property="og:description" content="Crie QR codes de links, textos e emails direto no navegador, sem upload, grátis. Baixe em PNG ou SVG." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://caoshub.vercel.app/tools/qr-code" />
        <meta name="twitter:title" content="Gerador de QR Code — Crie QR codes online grátis | CaosHub" />
        <meta name="twitter:description" content="Crie QR codes de links, textos e emails direto no navegador, sem upload, grátis. Baixe em PNG ou SVG." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 pb-12 space-y-6"
      >
        {/* Header */}
        <div className="space-y-1 pt-8">
          <h1 className="text-2xl font-bold text-text-primary">Gerador de QR Code</h1>
          <p className="text-sm text-text-secondary">
            Cole um link, texto ou email e gere um QR code instantaneamente.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">Conteúdo</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Cole um link, texto, email..."
            rows={4}
            className={cn(
              'w-full bg-surface border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 resize-none outline-none transition-colors duration-150',
              isOverLimit
                ? 'border-error focus:border-error'
                : 'border-border focus:border-accent/60',
            )}
          />
          <div className="flex justify-between items-center">
            {error ? (
              <p className="text-xs text-error">{error}</p>
            ) : (
              <span />
            )}
            <span className={cn('text-xs ml-auto', isOverLimit ? 'text-error' : 'text-text-secondary')}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-text-primary">Configurações</h2>

          {/* Size */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Tamanho</label>
            <div className="flex gap-2">
              {SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setOptions(o => ({ ...o, size: s.value }))}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150',
                    options.size === s.value
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-bg-primary border-border text-text-secondary hover:border-accent/40',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error correction */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Correção de erro
            </label>
            <div className="flex gap-2">
              {ERROR_LEVELS.map(lvl => (
                <button
                  key={lvl.value}
                  onClick={() => setOptions(o => ({ ...o, errorLevel: lvl.value }))}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150',
                    options.errorLevel === lvl.value
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-bg-primary border-border text-text-secondary hover:border-accent/40',
                  )}
                  title={`${lvl.pct} de recuperação`}
                >
                  {lvl.label}
                  <span className="ml-1 text-[10px] opacity-60">{lvl.pct}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="w-full flex justify-center min-h-[180px] items-center">
            {isGenerating ? (
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            ) : dataUrl ? (
              <motion.img
                key={dataUrl}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                src={dataUrl}
                alt="QR Code gerado"
                className="rounded-lg"
                style={{ imageRendering: 'pixelated', maxWidth: options.size, width: '100%' }}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-secondary/40">
                <QrCode className="w-16 h-16" strokeWidth={1} />
                <p className="text-sm">Digite algo para gerar o QR code</p>
              </div>
            )}
          </div>

          {/* Download buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="primary"
              disabled={!hasContent || !dataUrl}
              onClick={handleDownloadPng}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar PNG
            </Button>
            <Button
              variant="ghost"
              disabled={!hasContent}
              onClick={handleDownloadSvg}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar SVG
            </Button>
          </div>
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
