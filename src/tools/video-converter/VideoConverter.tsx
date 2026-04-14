import { useState, useRef, useCallback, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Clapperboard, Download, AlertTriangle } from 'lucide-react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, formatBytes, downloadBlob } from '../../lib/utils'

type OutputFormat = 'mp4' | 'webm' | 'mkv'
type QualityPreset = 'fast' | 'balanced' | 'hq'

interface ConversionResult {
  blob: Blob
  filename: string
  size: number
}

const FORMAT_OPTIONS: { label: string; value: OutputFormat }[] = [
  { label: 'MP4', value: 'mp4' },
  { label: 'WebM', value: 'webm' },
  { label: 'MKV', value: 'mkv' },
]

const QUALITY_OPTIONS: { label: string; value: QualityPreset; description: string }[] = [
  { label: 'Rápido', value: 'fast', description: 'Menor qualidade, mais veloz' },
  { label: 'Balanceado', value: 'balanced', description: 'Equilíbrio ideal' },
  { label: 'Alta Qualidade', value: 'hq', description: 'Melhor qualidade, mais lento' },
]

const CRF_MAP: Record<QualityPreset, string> = {
  fast: '28',
  balanced: '23',
  hq: '18',
}

const MIME_MAP: Record<OutputFormat, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
}

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

export function VideoConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp4')
  const [quality, setQuality] = useState<QualityPreset>('balanced')
  const [status, setStatus] = useState<'idle' | 'loading-ffmpeg' | 'converting' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [result, setResult] = useState<ConversionResult | null>(null)

  const ffmpegRef = useRef<FFmpeg | null>(null)
  const loadedRef = useRef<boolean>(false)
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    if (result) downloadBlob(result.blob, result.filename)
  }, [result])

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setStatus('idle')
    setProgress(0)
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

  const buildArgs = useCallback(
    (inputName: string, outputName: string, format: OutputFormat, preset: QualityPreset): string[] => {
      const crf = CRF_MAP[preset]
      switch (format) {
        case 'mp4':
          return ['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', crf, '-c:a', 'aac', outputName]
        case 'webm':
          return ['-i', inputName, '-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0', '-c:a', 'libopus', outputName]
        case 'mkv':
          return ['-i', inputName, '-c:v', 'libx264', '-preset', 'fast', '-crf', crf, '-c:a', 'aac', outputName]
      }
    },
    [],
  )

  const handleConvert = useCallback(async () => {
    if (!file) return
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

    setStatus('converting')

    const ext = file.name.split('.').pop() ?? 'mp4'
    const inputName = `input.${ext}`
    const outputName = `output.${outputFormat}`

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      await ffmpeg.exec(buildArgs(inputName, outputName, outputFormat, quality))

      const data = await ffmpeg.readFile(outputName)
      const blob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: MIME_MAP[outputFormat] })

      const baseName = file.name.replace(/\.[^.]+$/, '')
      setResult({ blob, filename: `${baseName}.${outputFormat}`, size: blob.size })
      setStatus('done')
      toast({ type: 'success', message: 'Conversão concluída com sucesso!' })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', message: 'Erro durante a conversão. Tente outro arquivo ou formato.' })
      setStatus('error')
    } finally {
      try {
        await ffmpeg.deleteFile(inputName)
        await ffmpeg.deleteFile(outputName)
      } catch {
        // cleanup errors are non-fatal
      }
    }
  }, [file, outputFormat, quality, getFFmpeg, buildArgs, toast])

  const isProcessing = status === 'loading-ffmpeg' || status === 'converting'

  return (
    <>
      <Helmet>
        <title>Conversor de Vídeo — MP4, WebM, MKV no navegador | CaosHub</title>
        <meta name="description" content="Converta vídeos MP4, MKV, AVI, MOV e WebM diretamente no navegador, sem upload para servidores. Suporte a múltiplos formatos e presets de qualidade via FFmpeg.wasm." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/video-converter" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/video-converter" />
        <meta property="og:site_name" content="CaosHub" />
        <meta property="og:title" content="Conversor de Vídeo — MP4, WebM, MKV no navegador | CaosHub" />
        <meta property="og:description" content="Converta vídeos MP4, MKV, AVI, MOV e WebM diretamente no navegador. Sem upload para servidores. Processado localmente via FFmpeg.wasm." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://caoshub.vercel.app/tools/video-converter" />
        <meta name="twitter:title" content="Conversor de Vídeo — MP4, WebM, MKV no navegador | CaosHub" />
        <meta name="twitter:description" content="Converta vídeos MP4, MKV, AVI, MOV e WebM diretamente no navegador. Sem upload para servidores. Processado localmente via FFmpeg.wasm." />
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
            <Clapperboard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Conversor de Vídeo</h1>
            <p className="text-text-secondary text-sm mt-1">
              Converta vídeos no navegador. Nenhum arquivo sai do seu dispositivo.
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

        {/* File info */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-4"
            >
              {/* Selected file */}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{formatBytes(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  className="shrink-0 h-7 px-3 text-xs"
                  onClick={() => {
                    setFile(null)
                    setResult(null)
                    setStatus('idle')
                  }}
                >
                  Remover
                </Button>
              </div>

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

              {/* Quality selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Preset de qualidade
                </label>
                <div className="flex gap-2">
                  {QUALITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setQuality(opt.value)}
                      disabled={isProcessing}
                      title={opt.description}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
                        quality === opt.value
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

              {/* Convert button */}
              <Button
                className="w-full"
                onClick={handleConvert}
                disabled={isProcessing}
                loading={isProcessing}
              >
                {status === 'loading-ffmpeg'
                  ? 'Carregando FFmpeg...'
                  : status === 'converting'
                    ? 'Convertendo...'
                    : 'Converter'}
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
                      label={status === 'loading-ffmpeg' ? 'Carregando FFmpeg...' : 'Convertendo...'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>Original: {file ? formatBytes(file.size) : '—'}</span>
                    <span className="text-border">→</span>
                    <span className="text-accent font-medium">{formatBytes(result.size)}</span>
                  </div>
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
