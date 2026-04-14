import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Download, Link2, Music2, RefreshCw, Video } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, isSafeDownloadUrl } from '../../lib/utils'

type MediaFormat = 'mp4' | 'mp3'
type QualityPreset = 'low' | 'full'
type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

interface JobResponse {
  id: string
  status: JobStatus
  progress: number
  mode?: 'single' | 'batch'
  format: MediaFormat
  quality: QualityPreset
  filename: string | null
  error: string | null
  urls?: string[]
  total_urls?: number
  completed_urls?: number
  created_at: string
  updated_at: string
  download_url: string | null
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

const envApiBase = (import.meta.env.VITE_MEDIA_API_URL as string | undefined)?.trim()
const API_BASE_CANDIDATES = envApiBase
  ? [normalizeBaseUrl(envApiBase)]
  : ['http://localhost:8000', 'http://localhost:8001']

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

function formatStatus(status: JobStatus): string {
  if (status === 'queued') return 'Na fila'
  if (status === 'processing') return 'Processando'
  if (status === 'completed') return 'Concluido'
  return 'Falhou'
}

function jobProgress(job: JobResponse): number {
  if (job.status === 'queued') return 10
  if (job.status === 'processing') return Math.min(95, Math.max(20, job.progress || 45))
  return 100
}

function parseErrorMessage(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw
  if (raw && typeof raw === 'object') {
    const detail = (raw as Record<string, unknown>).detail
    if (typeof detail === 'string' && detail.trim()) return detail
  }
  return 'Nao foi possivel concluir a operacao.'
}

function extractUrls(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean)
}

export function MediaDownloader() {
  const [urlInput, setUrlInput] = useState('')
  const [format, setFormat] = useState<MediaFormat>('mp4')
  const [quality, setQuality] = useState<QualityPreset>('full')
  const [job, setJob] = useState<JobResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiBase, setApiBase] = useState<string>(API_BASE_CANDIDATES[0] ?? 'http://localhost:8000')

  const { toasts, toast, dismiss } = useToast()
  const previousStatus = useRef<JobStatus | null>(null)

  const selectedFormat = useMemo(() => FORMAT_OPTIONS.find(item => item.value === format), [format])
  const selectedQuality = useMemo(() => QUALITY_OPTIONS.find(item => item.value === quality), [quality])
  const parsedUrls = useMemo(() => extractUrls(urlInput), [urlInput])

  const requestApi = useCallback(
    async (path: string, init?: RequestInit, fallbackOnNotFound = false): Promise<Response> => {
      const candidates = [apiBase, ...API_BASE_CANDIDATES.filter(candidate => candidate !== apiBase)]
      let networkError: Error | null = null

      for (const base of candidates) {
        try {
          const response = await fetch(`${base}${path}`, init)

          if (fallbackOnNotFound && response.status === 404 && candidates.length > 1) {
            continue
          }

          setApiBase(base)
          return response
        } catch (error) {
          if (error instanceof TypeError) {
            networkError = error
            continue
          }
          throw error
        }
      }

      if (networkError) {
        throw new Error(
          `Nao foi possivel conectar ao backend. Inicie a API em ${API_BASE_CANDIDATES.join(' ou ')}`,
        )
      }

      throw new Error('Backend indisponivel no momento.')
    },
    [apiBase],
  )

  useEffect(() => {
    let mounted = true

    const probe = async () => {
      const candidates = [apiBase, ...API_BASE_CANDIDATES.filter(candidate => candidate !== apiBase)]

      for (const base of candidates) {
        try {
          const response = await fetch(`${base}/api/health`)
          if (!response.ok) continue
          if (!mounted) return
          setApiBase(base)
          return
        } catch {
          // try next backend candidate
        }
      }
    }

    void probe()
    return () => {
      mounted = false
    }
  }, [apiBase])

  const fetchJobStatus = useCallback(
    async (jobId: string, silent = false) => {
      if (!silent) setIsRefreshing(true)
      try {
        const response = await requestApi(`/api/jobs/${jobId}`)
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(parseErrorMessage(payload))
        }

        setJob(payload as JobResponse)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao consultar status do job.'
        toast({ type: 'error', message })
      } finally {
        if (!silent) setIsRefreshing(false)
      }
    },
    [requestApi, toast],
  )

  useEffect(() => {
    if (!job) return
    if (job.status === 'completed' || job.status === 'failed') return

    const timer = window.setInterval(() => {
      void fetchJobStatus(job.id, true)
    }, 2500)

    return () => {
      window.clearInterval(timer)
    }
  }, [job, fetchJobStatus])

  useEffect(() => {
    if (!job) {
      previousStatus.current = null
      return
    }

    if (previousStatus.current === job.status) return

    if (job.status === 'completed') {
      toast({ type: 'success', message: 'Download pronto. Agora e so baixar o arquivo.' })
    }

    if (job.status === 'failed') {
      toast({ type: 'error', message: job.error || 'Nao foi possivel processar esse link.' })
    }

    previousStatus.current = job.status
  }, [job, toast])

  const startJob = useCallback(async () => {
    if (parsedUrls.length === 0) {
      toast({ type: 'warning', message: 'Cole ao menos uma URL antes de iniciar.' })
      return
    }
    if (parsedUrls.length > 25) {
      toast({ type: 'error', message: 'Limite de 25 URLs por job em lote.' })
      return
    }

    try {
      for (const sourceUrl of parsedUrls) {
        const parsed = new URL(sourceUrl)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('Use URL com http:// ou https://')
        }
      }
    } catch {
      toast({ type: 'error', message: 'Uma ou mais URLs estao invalidas. Verifique os links.' })
      return
    }

    setIsSubmitting(true)
    try {
      const body =
        parsedUrls.length === 1
          ? { url: parsedUrls[0], format, quality }
          : { urls: parsedUrls, format, quality }

      const response = await requestApi('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, true)

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(parseErrorMessage(payload))
      }

      setJob(payload as JobResponse)
      toast({
        type: 'success',
        message:
          parsedUrls.length > 1
            ? `Job em lote criado (${parsedUrls.length} URLs).`
            : 'Job criado com sucesso. Processamento iniciado.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar o job.'
      toast({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }, [format, parsedUrls, quality, requestApi, toast])

  const canStart = !isSubmitting && parsedUrls.length > 0
  const canRefresh = !!job && !isRefreshing
  const canDownload = !!job?.download_url && job.status === 'completed'

  return (
    <>
      <Helmet>
        <title>Media Downloader — Baixe vídeos e áudio por URL | CaosHub</title>
        <meta name="description" content="Cole qualquer URL e baixe como MP4 ou MP3. Suporte a batch com ZIP. Presets de qualidade low e full. Processado via backend com yt-dlp e ffmpeg." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/media-downloader" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/media-downloader" />
        <meta property="og:site_name" content="CaosHub" />
        <meta property="og:title" content="Media Downloader — Baixe vídeos e áudio por URL | CaosHub" />
        <meta property="og:description" content="Cole qualquer URL e baixe como MP4 ou MP3. Suporte a batch com ZIP. Presets low e full. Processado via backend com yt-dlp e ffmpeg." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://caoshub.vercel.app/tools/media-downloader" />
        <meta name="twitter:title" content="Media Downloader — Baixe vídeos e áudio por URL | CaosHub" />
        <meta name="twitter:description" content="Cole qualquer URL e baixe como MP4 ou MP3. Suporte a batch com ZIP. Presets low e full. Processado via backend com yt-dlp e ffmpeg." />
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
              Cole um ou varios links publicos de midia, escolha formato e qualidade, e gere o download.
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-surface border border-border rounded-xl p-4">
          <label htmlFor="media-url" className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            URLs da midia
          </label>
          <textarea
            id="media-url"
            value={urlInput}
            onChange={event => setUrlInput(event.target.value)}
            placeholder={'https://youtube.com/watch?v=...\nhttps://www.tiktok.com/@user/video/...'}
            className="w-full min-h-28 px-3 py-3 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-secondary/60 outline-none focus:border-accent/60 resize-y"
          />
          <p className="text-xs text-text-secondary">
            Uma URL por linha. Detectadas: <span className="text-text-primary font-medium">{parsedUrls.length}</span>
          </p>
          <p className="text-xs text-text-secondary">
            Backend: <span className="text-text-primary font-medium">{apiBase}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Formato</p>
            <div className="flex flex-col gap-2">
              {FORMAT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-sm transition-colors duration-150',
                    format === option.value
                      ? 'border-accent bg-accent/10 text-text-primary'
                      : 'border-border bg-bg-primary text-text-secondary hover:border-accent/40 hover:text-text-primary',
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
                  onClick={() => setQuality(option.value)}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-sm transition-colors duration-150',
                    quality === option.value
                      ? 'border-accent bg-accent/10 text-text-primary'
                      : 'border-border bg-bg-primary text-text-secondary hover:border-accent/40 hover:text-text-primary',
                  )}
                >
                  <span className="font-medium uppercase tracking-wide">{option.label}</span>
                  <span className="text-xs text-text-secondary">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={startJob} disabled={!canStart} loading={isSubmitting}>
            Gerar download
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setJob(null)
              previousStatus.current = null
            }}
            disabled={!job}
          >
            Limpar job
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              if (job) void fetchJobStatus(job.id)
            }}
            disabled={!canRefresh}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Atualizar status
          </Button>
        </div>

        <AnimatePresence>
          {job && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Job</p>
                  <p className="text-sm font-mono text-text-primary break-all">{job.id}</p>
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-md border',
                    job.status === 'completed' && 'border-success/40 text-success',
                    job.status === 'failed' && 'border-error/40 text-error',
                    (job.status === 'queued' || job.status === 'processing') && 'border-accent/40 text-accent',
                  )}
                >
                  {formatStatus(job.status)}
                </span>
              </div>

              <ProgressBar value={jobProgress(job)} label="Progresso" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-secondary">
                <p>
                  Modo:{' '}
                  <span className="text-text-primary font-medium uppercase">
                    {job.mode === 'batch' ? 'BATCH' : 'SINGLE'}
                  </span>
                </p>
                <p>
                  Formato: <span className="text-text-primary font-medium uppercase">{job.format}</span>
                </p>
                <p>
                  Qualidade: <span className="text-text-primary font-medium uppercase">{job.quality}</span>
                </p>
                <p>
                  URLs:{' '}
                  <span className="text-text-primary font-medium">
                    {job.completed_urls ?? 0}/{job.total_urls ?? 1}
                  </span>
                </p>
                <p className="sm:col-span-2">
                  Arquivo:{' '}
                  <span className="text-text-primary font-medium">
                    {job.filename ?? 'Aguardando geracao do arquivo final...'}
                  </span>
                </p>
              </div>

              {job.error && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-error/30 bg-error/5">
                  <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{job.error}</p>
                </div>
              )}

              <Button
                onClick={() => {
                  if (job.download_url && isSafeDownloadUrl(job.download_url, new URL(apiBase).origin)) {
                    window.location.assign(job.download_url)
                  }
                }}
                disabled={!canDownload}
                className="w-full"
              >
                <Download className="w-4 h-4" />
                {job.mode === 'batch' ? 'Baixar ZIP do lote' : 'Baixar arquivo'}
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
          <p>Lote: ate 25 URLs por job, com download final em ZIP.</p>
          <p>Plataformas suportadas dependem da disponibilidade publica da midia e do yt-dlp.</p>
        </div>
      </motion.div>
    </>
  )
}
