import { useCallback, useMemo, useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, Download, FileType2, RefreshCw } from 'lucide-react'
import JSZip from 'jszip'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, dataUrlToBlob, downloadBlob, formatBytes } from '../../lib/utils'
import { renderPdfPages, type ImageFormat } from '../pdf-to-images/utils/pdfToImages'

type OutputFormat = 'png' | 'jpeg' | 'webp'
type QualityPreset = 'low' | 'balanced' | 'full'
type ConvertStatus = 'idle' | 'converting' | 'done' | 'error'

interface ResultFile {
  blob: Blob
  filename: string
}

const OUTPUT_OPTIONS: { value: OutputFormat; label: string; description: string }[] = [
  { value: 'png', label: 'PNG', description: 'Lossless image pages in ZIP' },
  { value: 'jpeg', label: 'JPG', description: 'Smaller pages in ZIP' },
  { value: 'webp', label: 'WebP', description: 'Modern compressed pages in ZIP' },
]

const QUALITY_OPTIONS: { value: QualityPreset; label: string; description: string }[] = [
  { value: 'low', label: 'LOW', description: 'Smaller size and faster conversion' },
  { value: 'balanced', label: 'BALANCED', description: 'Best quality/size balance' },
  { value: 'full', label: 'FULL', description: 'Highest page quality' },
]

function presetToImageQuality(preset: QualityPreset): number {
  if (preset === 'low') return 0.65
  if (preset === 'full') return 0.95
  return 0.82
}

function presetToScale(preset: QualityPreset): number {
  if (preset === 'low') return 1.3
  if (preset === 'full') return 2.2
  return 1.7
}

function ensureZipFileName(name: string, format: OutputFormat): string {
  const base = name.replace(/\.pdf$/i, '') || 'pdf'
  return `${base}-${format}-pages.zip`
}

function convertDataUrlToMime(
  dataUrl: string,
  mimeType: 'image/webp',
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not initialize canvas context'))
        return
      }
      ctx.drawImage(image, 0, 0)
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Could not encode output image'))
            return
          }
          resolve(blob)
        },
        mimeType,
        quality,
      )
    }
    image.onerror = () => reject(new Error('Failed to decode rendered PDF page'))
    image.src = dataUrl
  })
}

export function PdfConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png')
  const [quality, setQuality] = useState<QualityPreset>('balanced')
  const [status, setStatus] = useState<ConvertStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ResultFile | null>(null)
  const [pagesConverted, setPagesConverted] = useState(0)

  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    if (result) downloadBlob(result.blob, result.filename)
  }, [result])

  const canConvert = useMemo(() => !!file && status !== 'converting', [file, status])

  const handleFiles = useCallback((files: File[]) => {
    const selected = files[0]
    if (!selected) return
    setFile(selected)
    setResult(null)
    setProgress(0)
    setStatus('idle')
    setPagesConverted(0)
  }, [])

  const handleConvert = useCallback(async () => {
    if (!file) return

    try {
      setStatus('converting')
      setProgress(5)
      setResult(null)

      const jpegQuality = presetToImageQuality(quality)
      const renderFormat: ImageFormat = outputFormat === 'jpeg' ? 'jpeg' : 'png'
      const renderedPages = await renderPdfPages(
        file,
        renderFormat,
        jpegQuality,
        presetToScale(quality),
        undefined,
        (current, total) => {
          const currentProgress = 5 + Math.round((current / Math.max(total, 1)) * 60)
          setProgress(Math.max(5, Math.min(70, currentProgress)))
        },
      )

      setPagesConverted(renderedPages.length)

      const zip = new JSZip()
      for (let index = 0; index < renderedPages.length; index += 1) {
        const page = renderedPages[index]
        let blob: Blob
        let ext: string

        if (outputFormat === 'webp') {
          blob = await convertDataUrlToMime(page.dataUrl, 'image/webp', jpegQuality)
          ext = 'webp'
        } else if (outputFormat === 'jpeg') {
          blob = dataUrlToBlob(page.dataUrl)
          ext = 'jpg'
        } else {
          blob = dataUrlToBlob(page.dataUrl)
          ext = 'png'
        }

        const pageNumber = String(page.pageNumber).padStart(3, '0')
        zip.file(`page-${pageNumber}.${ext}`, blob)
        const pagePackProgress = 70 + Math.round(((index + 1) / renderedPages.length) * 15)
        setProgress(Math.max(70, Math.min(85, pagePackProgress)))
      }

      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        metadata => {
          const zipProgress = 85 + Math.round((metadata.percent / 100) * 15)
          setProgress(Math.max(85, Math.min(100, zipProgress)))
        },
      )

      const outputName = ensureZipFileName(file.name, outputFormat)
      setResult({ blob: zipBlob, filename: outputName })
      setStatus('done')
      setProgress(100)
      toast({ type: 'success', message: 'PDF converted successfully.' })
    } catch (error) {
      console.error(error)
      setStatus('error')
      toast({ type: 'error', message: 'Failed to convert PDF. Try another file.' })
    }
  }, [file, outputFormat, quality, toast])

  return (
    <>
      <Helmet>
        <title>PDF Converter — Convert PDF to PNG, JPG, WebP | CaosHub</title>
        <meta name="description" content="Convert PDF pages to PNG, JPG or WebP directly in your browser. Choose quality preset and download all pages as a ZIP. No upload required." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/pdf-converter" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/pdf-converter" />
        <meta property="og:site_name" content="CaosHub" />
        <meta property="og:title" content="PDF Converter — Convert PDF to PNG, JPG, WebP | CaosHub" />
        <meta property="og:description" content="Convert PDF pages to PNG, JPG or WebP in your browser. No upload required. Download all pages as a ZIP." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://caoshub.vercel.app/tools/pdf-converter" />
        <meta name="twitter:title" content="PDF Converter — Convert PDF to PNG, JPG, WebP | CaosHub" />
        <meta name="twitter:description" content="Convert PDF pages to PNG, JPG or WebP in your browser. No upload required. Download all pages as a ZIP." />
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
            <FileType2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">PDF Converter</h1>
            <p className="text-text-secondary text-sm mt-1">
              Convert PDF pages to all available image extensions: PNG, JPG and WebP.
            </p>
          </div>
        </div>

        <FileUploadZone
          accept={['application/pdf', '.pdf']}
          multiple={false}
          onFiles={handleFiles}
          label="Drop your PDF here"
          hint="Input: PDF only"
        />

        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{formatBytes(file.size)}</p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-md border border-accent/40 text-accent uppercase tracking-wider">
                  PDF
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Output extension
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {OUTPUT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setOutputFormat(option.value)}
                      disabled={status === 'converting'}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-colors',
                        outputFormat === option.value
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-bg-primary hover:border-accent/40',
                        status === 'converting' && 'opacity-50 pointer-events-none',
                      )}
                    >
                      <p className={cn('text-sm font-semibold', outputFormat === option.value ? 'text-accent' : 'text-text-primary')}>
                        {option.label}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Quality preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {QUALITY_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setQuality(option.value)}
                      disabled={status === 'converting'}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-colors',
                        quality === option.value
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-bg-primary hover:border-accent/40',
                        status === 'converting' && 'opacity-50 pointer-events-none',
                      )}
                    >
                      <p className={cn('text-sm font-semibold', quality === option.value ? 'text-accent' : 'text-text-primary')}>
                        {option.label}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {(status === 'converting' || status === 'done') && (
                <ProgressBar value={progress} label="Converting PDF pages..." />
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleConvert} disabled={!canConvert} loading={status === 'converting'}>
                  <Archive className="w-4 h-4" />
                  Convert PDF
                </Button>
                <Button
                  variant="ghost"
                  disabled={status === 'converting'}
                  onClick={() => {
                    setFile(null)
                    setResult(null)
                    setStatus('idle')
                    setProgress(0)
                    setPagesConverted(0)
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <p className="text-sm text-text-secondary">
                Output ready with <span className="text-text-primary font-medium">{pagesConverted}</span> page(s).
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{result.filename}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{formatBytes(result.blob.size)}</p>
                </div>
                <Button onClick={() => downloadBlob(result.blob, result.filename)} className="shrink-0">
                  <Download className="w-4 h-4" />
                  Download ZIP
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
