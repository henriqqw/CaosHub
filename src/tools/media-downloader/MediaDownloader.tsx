import { useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Download, Link2, Music2, Video } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, formatBytes } from '../../lib/utils'

type MediaFormat = 'mp4' | 'mp3'
type QualityPreset = 'low' | 'full'

interface ResolveResult {
  url: string
  filename: string
  ext: string
  title: string
  filesize: number | null
  height: number | null
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

const envApiBase = (import.meta.env.VITE_MEDIA_API_URL as string | undefined)?.trim()
const API_BASE = envApiBase
  ? normalizeBaseUrl(envApiBase)
  : 'http://localhost:8000'

const FORMAT_OPTIONS: { value: MediaFormat; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    value: 'mp4',
    label: 'MP4 Video',
    icon: <Video className="w-4 h-4" />,
    hint: 'Baixa video com audio no mesmo arquivo.',
  },
  {
    value: 'mp3',
    label: 'MP3 Audio',
    icon: <Music2 className="w-4 h-4" />,
    hint: 'Extrai e converte para audio MP3.',
  },
]

const QUALITY_OPTIONS: { value: QualityPreset; label: string; hint: string }[] = [
  { value: 'low', label: 'Low', hint: 'Arquivo menor e processamento mais rapido.' },
  { value: 'full', label: 'Full', hint: 'Melhor qualidade disponivel na origem.' },
]

export function MediaDownloader() {
  const [urlInput, setUrlInput] = useState('')
  const [format, setFormat] = useState<MediaFormat>('mp4')
  const [quality, setQuality] = useState<QualityPreset>('full')
  const [isResolving, setIsResolving] = useState(false)
  const [result, setResult] = useState<ResolveResult | null>(null)

  const { toasts, toast, dismiss } = useToast()

  const parsedUrl = useMemo(() => {
    const trimmed = urlInput.trim()
    try {
      const parsed = new URL(trimmed)
      return ['http:', 'https:'].includes(parsed.protocol) ? trimmed : null
    } catch {
      return null
    }
  }, [urlInput])

  const canResolve = !!parsedUrl && !isResolving

  const handleResolve = useCallback(async () => {
    if (!parsedUrl) return

    setIsResolving(true)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/api/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsedUrl, format, quality }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const detail = payload?.detail ?? 'Nao foi possivel resolver essa URL.'
        throw new Error(detail)
      }

      setResult(payload as ResolveResult)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao resolver a URL.'
      toast({ type: 'error', message })
    } finally {
      setIsResolving(false)
    }
  }, [parsedUrl, format, quality, toast])

  const handleDownload = useCallback(() => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.filename
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [result])

  const selectedFormat = useMemo(() => FORMAT_OPTIONS.find(o => o.value === format), [format])
  const selectedQuality = useMemo(() => QUALITY_OPTIONS.find(o => o.value === quality), [quality])

  return (
    <>
      <Helmet>
        <title>Media Downloader — Baixe vídeos e áudio por URL | CaosHub</title>
        <meta name="description" content="Cole qualquer URL e baixe como MP4 ou MP3. Presets de qualidade low e full. Processado via backend com yt-dlp." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/media-downloader" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/media-downloader" />
        <meta property="og:site_name" content="CaosHub" />
        <meta property="og:title" content="Media Downloader — Baixe vídeos e áudio por URL | CaosHub" />
        <meta property="og:description" content="Cole qualquer URL e baixe como MP4 ou MP3. Presets low e full. Processado via backend com yt-dlp." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://caoshub.vercel.app/tools/media-downloader" />
        <meta name="twitter:title" content="Media Downloader — Baixe vídeos e áudio por URL | CaosHub" />
        <meta name="twitter:description" content="Cole qualquer URL e baixe como MP4 ou MP3. Presets low e full. Processado via backend com yt-dlp." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 py-8 pb-12 space-y-6"
      >
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
            <Link2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Media Downloader</h1>
            <p className="text-text-secondary text-sm mt-1">
              Cole um link publico de midia, escolha formato e qualidade, e baixe diretamente.
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-surface border border-border rounded-xl p-4">
          <label htmlFor="media-url" className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            URL da midia
          </label>
          <input
            id="media-url"
            type="url"
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setResult(null) }}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-secondary/60 outline-none focus:border-accent/60"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Formato</p>
            <div className="flex flex-col gap-2">
              {FORMAT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => { setFormat(option.value); setResult(null) }}
                  disabled={isResolving}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-sm transition-colors duration-150',
                    format === option.value
                      ? 'border-accent bg-accent/10 text-text-primary'
                      : 'border-border bg-bg-primary text-text-secondary hover:border-accent/40 hover:text-text-primary',
                    isResolving && 'opacity-50 pointer-events-none',
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                  <span className="text-xs text-text-secondary">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Qualidade</p>
            <div className="flex flex-col gap-2">
              {QUALITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => { setQuality(option.value); setResult(null) }}
                  disabled={isResolving}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-sm transition-colors duration-150',
                    quality === option.value
                      ? 'border-accent bg-accent/10 text-text-primary'
                      : 'border-border bg-bg-primary text-text-secondary hover:border-accent/40 hover:text-text-primary',
                    isResolving && 'opacity-50 pointer-events-none',
                  )}
                >
                  <span className="font-medium uppercase tracking-wide">{option.label}</span>
                  <span className="text-xs text-text-secondary">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleResolve} disabled={!canResolve} loading={isResolving} className="w-full">
          Resolver link
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-4"
            >
              <div className="space-y-1">
                <p className="text-xs text-text-secondary uppercase tracking-wider">Pronto para baixar</p>
                <p className="text-sm font-medium text-text-primary truncate">{result.title}</p>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="uppercase px-1.5 py-0.5 rounded border border-border">{result.ext}</span>
                  {result.height && <span>{result.height}p</span>}
                  {result.filesize && <span>{formatBytes(result.filesize)}</span>}
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full">
                <Download className="w-4 h-4" />
                Baixar {result.filename}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-start gap-3 bg-warning/5 border border-warning/20 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning/90 leading-relaxed">
            Use apenas links e conteudos que voce possui autorizacao para baixar. Plataformas com DRM,
            conteudo privado, paywall ou restricoes de direitos podem falhar.
          </p>
        </div>

        <div className="text-xs text-text-secondary space-y-1">
          <p>Preset atual: {selectedFormat?.label} + {selectedQuality?.label}</p>
          <p>O arquivo e baixado diretamente da origem — sem passar pelo servidor.</p>
          <p>Plataformas suportadas dependem da disponibilidade publica da midia e do yt-dlp.</p>
        </div>
      </motion.div>
    </>
  )
}
