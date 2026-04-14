import { useState, useRef, useCallback, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Download, AlertTriangle } from 'lucide-react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, formatBytes, downloadBlob } from '../../lib/utils'

type TrimFormat = 'same' | 'mp4' | 'webm'

interface TrimResult {
  blob: Blob
  filename: string
  size: number
}

const FORMAT_OPTIONS: { label: string; value: TrimFormat }[] = [
  { label: 'Mesmo formato', value: 'same' },
  { label: 'MP4', value: 'mp4' },
  { label: 'WebM', value: 'webm' },
]

const MIME_MAP: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  flv: 'video/x-flv',
}

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

function parseTimeToSeconds(value: string): number | null {
  const trimmed = value.trim()

  // Plain number
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed)
  }

  // MM:SS or HH:MM:SS
  const parts = trimmed.split(':')
  if (parts.length === 2) {
    const [mm, ss] = parts.map(Number)
    if (isNaN(mm) || isNaN(ss)) return null
    return mm * 60 + ss
  }
  if (parts.length === 3) {
    const [hh, mm, ss] = parts.map(Number)
    if (isNaN(hh) || isNaN(mm) || isNaN(ss)) return null
    return hh * 3600 + mm * 60 + ss
  }

  return null
}

function formatSecondsToHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  const hStr = h.toString().padStart(2, '0')
  const mStr = m.toString().padStart(2, '0')
  const sStr = s.toString().padStart(2, '0')
  return `${hStr}:${mStr}:${sStr}`
}

export function VideoTrimmer() {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<string>('00:00:00')
  const [endTime, setEndTime] = useState<string>('')
  const [outputFormat, setOutputFormat] = useState<TrimFormat>('same')
  const [status, setStatus] = useState<'idle' | 'loading-ffmpeg' | 'trimming' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [result, setResult] = useState<TrimResult | null>(null)
  const [timeError, setTimeError] = useState<string>('')

  const ffmpegRef = useRef<FFmpeg | null>(null)
  const loadedRef = useRef<boolean>(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    if (result) downloadBlob(result.blob, result.filename)
  }, [result])

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return

    // Revoke previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    const url = URL.createObjectURL(f)
    objectUrlRef.current = url

    setFile(f)
    setDuration(null)
    setStartTime('00:00:00')
    setEndTime('')
    setResult(null)
    setStatus('idle')
    setProgress(0)
    setTimeError('')

    if (videoRef.current) {
      videoRef.current.src = url
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return
    const d = videoRef.current.duration
    if (isFinite(d)) {
      setDuration(d)
      setEndTime(formatSecondsToHMS(d))
    }
  }, [])

  const getFFmpeg = useCallback(async (): Promise<FFmpeg> => {
    if (ffmpegRef.current && loadedRef.current) return ffmpegRef.current

    const instance = new FFmpeg()
    ffmpegRef.current = instance

    instance.on('progress', ({ progress: p }) => {
      setProgress(Math.round(p * 100))
    })

    setStatus('loading-ffmpeg')
    await instance.load({
      coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    loadedRef.current = true
    return instance
  }, [])

  const validateTimes = useCallback((): { start: number; end: number } | null => {
    const start = parseTimeToSeconds(startTime)
    const end = parseTimeToSeconds(endTime)

    if (start === null) {
      setTimeError('Tempo de início inválido. Use HH:MM:SS ou segundos.')
      return null
    }
    if (end === null) {
      setTimeError('Tempo de fim inválido. Use HH:MM:SS ou segundos.')
      return null
    }
    if (start < 0) {
      setTimeError('O tempo de início não pode ser negativo.')
      return null
    }
    if (duration !== null && start >= duration) {
      setTimeError('O tempo de início deve ser menor que a duração do vídeo.')
      return null
    }
    if (end <= start) {
      setTimeError('O tempo de fim deve ser maior que o tempo de início.')
      return null
    }
    if (duration !== null && end > duration) {
      setTimeError(`O tempo de fim não pode ultrapassar ${formatSecondsToHMS(duration)}.`)
      return null
    }

    setTimeError('')
    return { start, end }
  }, [startTime, endTime, duration])

  const handleTrim = useCallback(async () => {
    if (!file) return

    const times = validateTimes()
    if (!times) return

    setResult(null)
    setProgress(0)

    let ffmpeg: FFmpeg
    try {
      ffmpeg = await getFFmpeg()
    } catch {
      toast({ type: 'error', message: 'Falha ao carregar o FFmpeg. Verifique sua conexão.' })
      setStatus('error')
      return
    }

    setStatus('trimming')

    const inputExt = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
    const resolvedFormat = outputFormat === 'same' ? inputExt : outputFormat
    const inputName = `input.${inputExt}`
    const outputName = `output.${resolvedFormat}`
    const mimeType = MIME_MAP[resolvedFormat] ?? 'video/mp4'

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      await ffmpeg.exec([
        '-i', inputName,
        '-ss', times.start.toString(),
        '-to', times.end.toString(),
        '-c', 'copy',
        outputName,
      ])

      const data = await ffmpeg.readFile(outputName)
      const blob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: mimeType })

      const baseName = file.name.replace(/\.[^.]+$/, '')
      setResult({ blob, filename: `${baseName}-trimmed.${resolvedFormat}`, size: blob.size })
      setStatus('done')
      toast({ type: 'success', message: 'Corte concluído com sucesso!' })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', message: 'Erro durante o corte. Tente outro arquivo ou formato.' })
      setStatus('error')
    } finally {
      try {
        await ffmpeg.deleteFile(inputName)
        await ffmpeg.deleteFile(outputName)
      } catch {
        // cleanup errors are non-fatal
      }
    }
  }, [file, outputFormat, validateTimes, getFFmpeg, toast])

  const isProcessing = status === 'loading-ffmpeg' || status === 'trimming'

  return (
    <>
      <Helmet>
        <title>Cortar Vídeo — Trim sem perda de qualidade no navegador | CaosHub</title>
        <meta
          name="description"
          content="Corte trechos de vídeo diretamente no navegador sem perda de qualidade. Suporte a MP4, MKV, AVI, MOV, WebM. Nenhum arquivo sai do seu dispositivo."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/video-trimmer" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/video-trimmer" />
        <meta property="og:title" content="Cortar Vídeo — CaosHub" />
        <meta
          property="og:description"
          content="Corte trechos de vídeo diretamente no navegador sem perda de qualidade."
        />
        <meta name="twitter:title" content="Cortar Vídeo — CaosHub" />
        <meta
          name="twitter:description"
          content="Corte trechos de vídeo diretamente no navegador sem perda de qualidade."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 py-8 pb-12 space-y-6"
      >
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
            <Timer className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Cortar Vídeo</h1>
            <p className="text-text-secondary text-sm mt-1">
              Recorte trechos de vídeo no navegador, sem perda de qualidade.
            </p>
          </div>
        </div>

        {/* CDN warning */}
        <div className="flex items-start gap-3 bg-warning/5 border border-warning/20 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning/90">
            Na primeira execução, o FFmpeg (~30 MB) é baixado do CDN. Fica em cache depois.
          </p>
        </div>

        {/* Upload zone */}
        <FileUploadZone
          accept={['video/*', '.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv']}
          multiple={false}
          onFiles={handleFiles}
          label="Arraste um vídeo aqui ou clique para selecionar"
          hint="MP4, MKV, AVI, MOV, WebM, FLV"
        />

        {/* Video preview + controls */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Video player */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  controls
                  onLoadedMetadata={handleLoadedMetadata}
                  className="w-full max-h-64 bg-black"
                />
                {duration !== null && (
                  <div className="px-4 py-2 border-t border-border">
                    <p className="text-xs text-text-secondary">
                      Duração: <span className="text-text-primary font-medium">{formatSecondsToHMS(duration)}</span>
                      <span className="ml-2 text-border">·</span>
                      <span className="ml-2">{file.name}</span>
                      <span className="ml-2 text-border">·</span>
                      <span className="ml-2">{formatBytes(file.size)}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Trim controls */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
                {/* Time inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Início
                    </label>
                    <input
                      type="text"
                      value={startTime}
                      onChange={e => {
                        setStartTime(e.target.value)
                        setTimeError('')
                      }}
                      disabled={isProcessing}
                      placeholder="00:00:00"
                      className={cn(
                        'w-full px-3 py-2 rounded-lg bg-bg-primary border text-sm text-text-primary placeholder:text-text-secondary/50 outline-none transition-colors duration-150',
                        timeError
                          ? 'border-error focus:border-error'
                          : 'border-border focus:border-accent',
                        isProcessing && 'opacity-40',
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Fim
                    </label>
                    <input
                      type="text"
                      value={endTime}
                      onChange={e => {
                        setEndTime(e.target.value)
                        setTimeError('')
                      }}
                      disabled={isProcessing}
                      placeholder={duration !== null ? formatSecondsToHMS(duration) : '00:00:00'}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg bg-bg-primary border text-sm text-text-primary placeholder:text-text-secondary/50 outline-none transition-colors duration-150',
                        timeError
                          ? 'border-error focus:border-error'
                          : 'border-border focus:border-accent',
                        isProcessing && 'opacity-40',
                      )}
                    />
                  </div>
                </div>

                {timeError && (
                  <p className="text-xs text-error">{timeError}</p>
                )}

                <p className="text-xs text-text-secondary">
                  Aceita HH:MM:SS, MM:SS ou segundos (ex: 90.5)
                </p>

                {/* Format selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Formato de saída
                  </label>
                  <div className="flex gap-2">
                    {FORMAT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setOutputFormat(opt.value)}
                        disabled={isProcessing}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
                          outputFormat === opt.value
                            ? 'bg-accent border-accent text-white'
                            : 'bg-bg-primary border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
                          isProcessing && 'opacity-40 pointer-events-none',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trim button */}
                <Button
                  className="w-full"
                  onClick={handleTrim}
                  disabled={isProcessing || duration === null}
                  loading={isProcessing}
                >
                  {status === 'loading-ffmpeg'
                    ? 'Carregando FFmpeg...'
                    : status === 'trimming'
                      ? 'Cortando...'
                      : 'Cortar Vídeo'}
                </Button>

                {/* Progress */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ProgressBar
                        value={status === 'loading-ffmpeg' ? 0 : progress}
                        label={status === 'loading-ffmpeg' ? 'Carregando FFmpeg...' : 'Cortando...'}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Resultado
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{result.filename}</p>
                  <p className="text-xs text-text-secondary">
                    {formatBytes(result.size)}
                  </p>
                </div>
                <Button
                  className="shrink-0"
                  onClick={() => downloadBlob(result.blob, result.filename)}
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
