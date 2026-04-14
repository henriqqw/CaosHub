import { useState, useRef, useCallback, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { AudioLines, Download, AlertTriangle } from 'lucide-react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, formatBytes, downloadBlob } from '../../lib/utils'

type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac' | 'flac'
type Mp3Bitrate = '128k' | '192k' | '320k'

interface ConversionResult {
  blob: Blob
  filename: string
  size: number
}

const FORMAT_OPTIONS: { label: string; value: AudioFormat; description: string }[] = [
  { label: 'MP3', value: 'mp3', description: 'Compatibilidade universal' },
  { label: 'WAV', value: 'wav', description: 'Sem compressão, máxima qualidade' },
  { label: 'OGG', value: 'ogg', description: 'Open source, boa compressão' },
  { label: 'AAC', value: 'aac', description: 'Alta qualidade, menor tamanho' },
  { label: 'FLAC', value: 'flac', description: 'Lossless, sem perdas' },
]

const BITRATE_OPTIONS: { label: string; value: Mp3Bitrate }[] = [
  { label: '128 kbps', value: '128k' },
  { label: '192 kbps', value: '192k' },
  { label: '320 kbps', value: '320k' },
]

const MIME_MAP: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
}

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

export function AudioConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('mp3')
  const [mp3Bitrate, setMp3Bitrate] = useState<Mp3Bitrate>('192k')
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
    (inputName: string, outputName: string, format: AudioFormat, bitrate: Mp3Bitrate): string[] => {
      switch (format) {
        case 'mp3':
          return ['-i', inputName, '-vn', '-c:a', 'libmp3lame', '-b:a', bitrate, outputName]
        case 'wav':
          return ['-i', inputName, '-vn', '-c:a', 'pcm_s16le', outputName]
        case 'ogg':
          return ['-i', inputName, '-vn', '-c:a', 'libvorbis', outputName]
        case 'aac':
          return ['-i', inputName, '-vn', '-c:a', 'aac', outputName]
        case 'flac':
          return ['-i', inputName, '-vn', '-c:a', 'flac', outputName]
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

    const inputExt = file.name.split('.').pop() ?? 'mp3'
    const inputName = `input.${inputExt}`
    const outputName = `output.${outputFormat}`

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      await ffmpeg.exec(buildArgs(inputName, outputName, outputFormat, mp3Bitrate))

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
  }, [file, outputFormat, mp3Bitrate, getFFmpeg, buildArgs, toast])

  const isProcessing = status === 'loading-ffmpeg' || status === 'converting'

  return (
    <>
      <Helmet>
        <title>Conversor de Áudio — MP3, WAV, OGG, FLAC no navegador | CaosHub</title>
        <meta
          name="description"
          content="Converta áudio para MP3, WAV, OGG, AAC ou FLAC diretamente no navegador. Extraia áudio de vídeos. Nenhum arquivo sai do seu dispositivo."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/audio-converter" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/audio-converter" />
        <meta property="og:title" content="Conversor de Áudio — CaosHub" />
        <meta
          property="og:description"
          content="Converta áudio para MP3, WAV, OGG, AAC ou FLAC diretamente no navegador. Extraia áudio de vídeos."
        />
        <meta name="twitter:title" content="Conversor de Áudio — CaosHub" />
        <meta
          name="twitter:description"
          content="Converta áudio para MP3, WAV, OGG, AAC ou FLAC diretamente no navegador. Extraia áudio de vídeos."
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
            <AudioLines className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Conversor de Áudio</h1>
            <p className="text-text-secondary text-sm mt-1">
              Converta áudio ou extraia som de vídeos no navegador. Nenhum arquivo sai do seu dispositivo.
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
          accept={[
            'audio/*',
            'video/*',
            '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma', '.opus',
            '.mp4', '.mkv', '.avi', '.mov', '.webm',
          ]}
          multiple={false}
          onFiles={handleFiles}
          label="Arraste um arquivo de áudio ou vídeo aqui"
          hint="Áudio: MP3, WAV, OGG, AAC, FLAC, M4A — Vídeo: MP4, MKV, AVI, MOV, WebM"
        />

        {/* File info + controls */}
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
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setOutputFormat(opt.value)}
                      disabled={isProcessing}
                      title={opt.description}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
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
                <p className="text-xs text-text-secondary">
                  {FORMAT_OPTIONS.find(o => o.value === outputFormat)?.description}
                </p>
              </div>

              {/* MP3 bitrate selector */}
              <AnimatePresence>
                {outputFormat === 'mp3' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Bitrate MP3
                    </label>
                    <div className="flex gap-2">
                      {BITRATE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setMp3Bitrate(opt.value)}
                          disabled={isProcessing}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
                            mp3Bitrate === opt.value
                              ? 'bg-accent border-accent text-white'
                              : 'bg-bg-primary border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
                            isProcessing && 'opacity-40 pointer-events-none',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
