import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, ChevronDown, Download, Languages, RefreshCw, Search, Subtitles, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, formatBytes } from '../../lib/utils'

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

interface TranscriptionJobResponse {
  id: string
  status: JobStatus
  progress: number
  source_filename: string
  requested_language: string | null
  detected_language: string | null
  duration_seconds: number | null
  filename: string | null
  error: string | null
  created_at: string
  updated_at: string
  download_url: string | null
}

interface LanguageOption {
  code: string
  name: string
  nativeName: string
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: '', name: 'Auto Detect', nativeName: 'Detectar Automaticamente' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: 'Nihongo' },
  { code: 'ko', name: 'Korean', nativeName: 'Hangugeo' },
  { code: 'zh', name: 'Chinese', nativeName: 'Zhongwen' },
  { code: 'ru', name: 'Russian', nativeName: 'Russkiy' },
  { code: 'ar', name: 'Arabic', nativeName: 'Al-Arabiyya' },
  { code: 'tr', name: 'Turkish', nativeName: 'Turkce' },
  { code: 'hi', name: 'Hindi', nativeName: 'Hindi' },
]

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

const envApiBase = (import.meta.env.VITE_MEDIA_API_URL as string | undefined)?.trim()
const API_BASE_CANDIDATES = envApiBase
  ? [normalizeBaseUrl(envApiBase)]
  : ['http://localhost:8000', 'http://localhost:8001']

function formatStatus(status: JobStatus): string {
  if (status === 'queued') return 'Queued'
  if (status === 'processing') return 'Processing'
  if (status === 'completed') return 'Completed'
  return 'Failed'
}

function parseErrorMessage(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw
  if (raw && typeof raw === 'object') {
    const detail = (raw as Record<string, unknown>).detail
    if (typeof detail === 'string' && detail.trim()) return detail
  }
  return 'Failed to complete transcription job.'
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '-'
  const total = Math.round(seconds)
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function Transcriber() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('')
  const [languageQuery, setLanguageQuery] = useState('')
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [job, setJob] = useState<TranscriptionJobResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiBase, setApiBase] = useState<string>(API_BASE_CANDIDATES[0] ?? 'http://localhost:8000')

  const { toasts, toast, dismiss } = useToast()
  const previousStatus = useRef<JobStatus | null>(null)

  // On mount: probe each candidate with GET /api/health to find the real CaosHub backend.
  // Uses a 4-second timeout so a hung port doesn't block startup.
  useEffect(() => {
    let cancelled = false

    async function probeBackend() {
      for (const base of API_BASE_CANDIDATES) {
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), 4_000)
        try {
          const response = await fetch(`${base}/api/health`, { signal: controller.signal })
          window.clearTimeout(timeoutId)
          if (!response.ok) continue
          const data = await response.json().catch(() => null)
          if (data && typeof data === 'object' && 'whisper_available' in data) {
            if (!cancelled) setApiBase(base)
            return
          }
        } catch {
          window.clearTimeout(timeoutId)
        }
      }
    }

    void probeBackend()
    return () => { cancelled = true }
  }, [])

  const requestApi = useCallback(
    async (path: string, init?: RequestInit): Promise<Response> => {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 60_000)
      try {
        const response = await fetch(`${apiBase}${path}`, { ...init, signal: controller.signal })
        window.clearTimeout(timeoutId)
        return response
      } catch (error) {
        window.clearTimeout(timeoutId)
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('Request timed out. Check that the backend is responding.')
        }
        if (error instanceof TypeError) {
          throw new Error(`Cannot reach backend at ${apiBase}. Make sure the API is running.`)
        }
        throw error
      }
    },
    [apiBase],
  )

  const fetchJobStatus = useCallback(
    async (jobId: string, silent = false) => {
      if (!silent) setIsRefreshing(true)
      try {
        const response = await requestApi(`/api/transcriptions/jobs/${jobId}`)
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(parseErrorMessage(payload))
        }

        setJob(payload as TranscriptionJobResponse)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to refresh transcription status.'
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

    if (job.status === previousStatus.current) return

    if (job.status === 'completed') {
      toast({ type: 'success', message: 'Transcription ready. Download TXT + SRT ZIP.' })
    }
    if (job.status === 'failed') {
      toast({ type: 'error', message: job.error || 'Transcription failed.' })
    }

    previousStatus.current = job.status
  }, [job, toast])

  useEffect(() => {
    if (job?.status === 'completed' && job.download_url) {
      const a = document.createElement('a')
      a.href = job.download_url
      a.download = job.filename ?? 'transcription.zip'
      a.click()
    }
  }, [job?.status])

  useEffect(() => {
    if (!isLanguageModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLanguageModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLanguageModalOpen])

  useEffect(() => {
    if (!isLanguageModalOpen || typeof document === 'undefined') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isLanguageModalOpen])

  const handleFiles = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    setSelectedFile(file)
  }, [])

  const startTranscription = useCallback(async () => {
    if (!selectedFile) {
      toast({ type: 'warning', message: 'Select an audio or video file first.' })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const normalizedLanguage = language.trim().toLowerCase()
      if (normalizedLanguage) {
        formData.append('language', normalizedLanguage)
      }

      const response = await requestApi('/api/transcriptions/jobs', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(parseErrorMessage(payload))
      }

      setJob(payload as TranscriptionJobResponse)
      toast({ type: 'success', message: 'Transcription job created.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create transcription job.'
      toast({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedFile, language, requestApi, toast])

  const canStart = !!selectedFile && !isSubmitting
  const canRefresh = !!job && !isRefreshing
  const canDownload = !!job?.download_url && job.status === 'completed'

  const selectedLanguageOption = useMemo(() => {
    return LANGUAGE_OPTIONS.find(option => option.code === language) ?? LANGUAGE_OPTIONS[0]
  }, [language])

  const filteredLanguageOptions = useMemo(() => {
    const normalizedQuery = languageQuery.trim().toLowerCase()
    if (!normalizedQuery) return LANGUAGE_OPTIONS

    return LANGUAGE_OPTIONS.filter(option => {
      const haystack = `${option.code} ${option.name} ${option.nativeName}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [languageQuery])

  const progressValue = useMemo(() => {
    if (!job) return 0
    if (job.status === 'queued') return 10
    if (job.status === 'processing') return Math.min(95, Math.max(15, job.progress || 50))
    return 100
  }, [job])

  return (
    <>
      <Helmet>
        <title>Transcriber - Whisper TXT and SRT | CaosHub</title>
        <meta
          name="description"
          content="Upload audio or video and generate automatic transcript (TXT) plus subtitles (SRT) with Whisper."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/transcriber" />
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
            <Subtitles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Transcriber (Whisper)</h1>
            <p className="text-text-secondary text-sm mt-1">
              Upload media to generate transcript TXT and subtitle SRT automatically.
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-surface border border-border rounded-xl p-4">
          <FileUploadZone
            accept={[
              'audio/*',
              'video/*',
              '.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.opus',
              '.mp4', '.mov', '.mkv', '.avi', '.webm',
            ]}
            multiple={false}
            onFiles={handleFiles}
            label="Drop audio/video file here"
            hint="Supported: MP3, WAV, M4A, MP4, MOV, MKV, WebM and more"
          />

          {selectedFile && (
            <div className="text-xs text-text-secondary">
              File: <span className="text-text-primary font-medium">{selectedFile.name}</span> ({formatBytes(selectedFile.size)})
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Requested language (optional)
            </label>

            <button
              type="button"
              onClick={() => setIsLanguageModalOpen(true)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-bg-primary text-sm text-text-primary outline-none transition-colors hover:border-accent/50 focus:border-accent/60 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Languages className="w-4 h-4 text-text-secondary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="truncate font-medium text-text-primary">{selectedLanguageOption.nativeName}</p>
                  <p className="text-[11px] uppercase tracking-wider text-text-secondary">
                    {selectedLanguageOption.code || 'auto'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
            </button>

            <p className="text-xs text-text-secondary">
              Auto detect usually works well. Manually select a language for better accuracy.
            </p>
          </div>

          <p className="text-xs text-text-secondary">
            Backend: <span className="text-text-primary font-medium">{apiBase}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={startTranscription} disabled={!canStart} loading={isSubmitting}>
            Start transcription
          </Button>

          <Button
            variant="ghost"
            disabled={!job}
            onClick={() => {
              setJob(null)
              previousStatus.current = null
            }}
          >
            Clear job
          </Button>

          <Button
            variant="ghost"
            disabled={!canRefresh}
            onClick={() => {
              if (job) void fetchJobStatus(job.id)
            }}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh status
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

              <ProgressBar value={progressValue} label="Progress" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-secondary">
                <p>
                  Source: <span className="text-text-primary font-medium">{job.source_filename}</span>
                </p>
                <p>
                  Requested language: <span className="text-text-primary font-medium uppercase">{job.requested_language || 'auto'}</span>
                </p>
                <p>
                  Detected language: <span className="text-text-primary font-medium uppercase">{job.detected_language || '-'}</span>
                </p>
                <p>
                  Duration: <span className="text-text-primary font-medium">{formatDuration(job.duration_seconds)}</span>
                </p>
                <p className="sm:col-span-2">
                  Output: <span className="text-text-primary font-medium">{job.filename ?? 'Waiting for output zip...'}</span>
                </p>
              </div>

              {job.error && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-error/30 bg-error/5">
                  <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{job.error}</p>
                </div>
              )}

              <Button
                className="w-full"
                disabled={!canDownload}
                onClick={() => {
                  if (job.download_url) window.location.assign(job.download_url)
                }}
              >
                <Download className="w-4 h-4" />
                Download TXT + SRT ZIP
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLanguageModalOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/70"
                onClick={() => {
                  setIsLanguageModalOpen(false)
                  setLanguageQuery('')
                }}
                aria-label="Close language selector"
              />

              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                role="dialog"
                aria-modal="true"
                className="fixed inset-x-4 top-[8vh] z-[71] mx-auto max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Request language</p>
                    <p className="text-xs text-text-secondary">Choose language or keep auto detect</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLanguageModalOpen(false)
                      setLanguageQuery('')
                    }}
                    className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-4 py-3 border-b border-border">
                  <div className="relative">
                    <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={languageQuery}
                      onChange={event => setLanguageQuery(event.target.value)}
                      placeholder="Search by code or language..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-secondary/60 outline-none focus:border-accent/60"
                    />
                  </div>
                </div>

                <div className="max-h-[340px] overflow-y-auto p-2">
                  {filteredLanguageOptions.length === 0 && (
                    <div className="px-3 py-4 text-sm text-text-secondary">
                      No languages found for this search.
                    </div>
                  )}

                  {filteredLanguageOptions.map(option => {
                    const isSelected = option.code === language
                    return (
                      <button
                        type="button"
                        key={option.code || 'auto'}
                        onClick={() => {
                          setLanguage(option.code)
                          setIsLanguageModalOpen(false)
                          setLanguageQuery('')
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                          isSelected
                            ? 'border border-accent/40 bg-accent/10 text-accent'
                            : 'border border-transparent text-text-primary hover:bg-white/5',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{option.nativeName}</p>
                          <p className="text-xs text-text-secondary uppercase tracking-wider">
                            {option.code || 'auto'} · {option.name}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex items-start gap-3 bg-warning/5 border border-warning/20 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning/90 leading-relaxed">
            Use only content you are authorized to process. Very large files can take longer.
          </p>
        </div>
      </motion.div>
    </>
  )
}
