import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Trash2, ImageDown } from 'lucide-react'
import JSZip from 'jszip'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { useImageCompressor } from './hooks/useImageCompressor'
import { CompressionItem } from './components/CompressionItem'
import { cn, dataUrlToBlob, downloadBlob } from '../../lib/utils'
import type { CompressFormat } from './utils/compressImage'

const FORMAT_OPTIONS: { label: string; value: CompressFormat }[] = [
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' },
  { label: 'WebP', value: 'webp' },
]

export function ImageCompressor() {
  const [format, setFormat] = useState<CompressFormat>('jpeg')
  const [quality, setQuality] = useState(0.8)
  const { toasts, toast, dismiss } = useToast()
  const { items, addFiles, removeItem, recompressAll, clearAll } = useImageCompressor()
  const [downloadingZip, setDownloadingZip] = useState(false)
  const prevFormatRef = useRef<CompressFormat>(format)
  const prevQualityRef = useRef<number>(quality)

  // Re-compress all when format or quality changes
  useEffect(() => {
    const formatChanged = prevFormatRef.current !== format
    const qualityChanged = prevQualityRef.current !== quality
    prevFormatRef.current = format
    prevQualityRef.current = quality

    if ((formatChanged || qualityChanged) && items.length > 0) {
      recompressAll(format, quality, items)
    }
  // items intentionally excluded — we only want to react to format/quality changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality, recompressAll])

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      toast({ type: 'error', message: 'Selecione apenas arquivos de imagem.' })
      return
    }
    addFiles(imageFiles, format, quality)
  }

  const doneItems = items.filter(i => i.status === 'done')
  const hasMultipleDone = doneItems.length > 1

  const handleDownloadZip = async () => {
    if (doneItems.length === 0) return
    setDownloadingZip(true)
    try {
      const zip = new JSZip()
      for (const item of doneItems) {
        if (!item.result) continue
        const blob = dataUrlToBlob(item.result.dataUrl)
        const ext = item.result.dataUrl.split(';')[0].split('/')[1] ?? 'jpg'
        const baseName = item.file.name.replace(/\.[^.]+$/, '')
        zip.file(`${baseName}-compressed.${ext}`, blob)
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(zipBlob, 'imagens-comprimidas.zip')
      toast({ type: 'success', message: `${doneItems.length} imagens exportadas em ZIP.` })
    } catch {
      toast({ type: 'error', message: 'Erro ao gerar ZIP.' })
    } finally {
      setDownloadingZip(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Compressor de Imagens — Comprima JPEG, PNG e WebP no navegador | CaosHub</title>
        <meta name="description" content="Comprima imagens JPEG, PNG e WebP diretamente no navegador, sem upload para servidores. Controle de qualidade, comparação antes/depois e download em lote." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/image-compressor" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/image-compressor" />
        <meta property="og:site_name" content="CaosHub" />
        <meta property="og:title" content="Compressor de Imagens — Comprima JPEG, PNG e WebP no navegador | CaosHub" />
        <meta property="og:description" content="Comprima imagens JPEG, PNG e WebP diretamente no navegador, sem upload para servidores. Controle de qualidade e download em lote." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://caoshub.vercel.app/tools/image-compressor" />
        <meta name="twitter:title" content="Compressor de Imagens — Comprima JPEG, PNG e WebP no navegador | CaosHub" />
        <meta name="twitter:description" content="Comprima imagens JPEG, PNG e WebP diretamente no navegador, sem upload para servidores. Controle de qualidade e download em lote." />
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
            <ImageDown className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Compressor de Imagens</h1>
            <p className="text-text-secondary text-sm mt-1">
              Comprima imagens no navegador. Nenhum arquivo sai do seu dispositivo.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          {/* Format selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Formato de saída
            </label>
            <div className="flex gap-2">
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
                    format === opt.value
                      ? 'bg-accent border-accent text-white'
                      : 'bg-bg-primary border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider — hidden for PNG */}
          <AnimatePresence>
            {format !== 'png' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Qualidade
                  </label>
                  <span className="text-sm font-semibold text-text-primary">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={Math.round(quality * 100)}
                  onChange={e => setQuality(Number(e.target.value) / 100)}
                  className="w-full h-1.5 appearance-none rounded-full bg-border accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Menor arquivo</span>
                  <span>Maior qualidade</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {format === 'png' && (
            <p className="text-xs text-text-secondary">
              PNG usa compressão lossless — qualidade máxima, tamanho pode ser maior.
            </p>
          )}
        </div>

        {/* Upload zone */}
        <FileUploadZone
          accept={['image/*', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']}
          multiple
          onFiles={handleFiles}
          label="Arraste imagens aqui ou clique para selecionar"
          hint="JPEG, PNG, WebP, GIF, BMP — múltiplos arquivos suportados"
        />

        {/* Items list */}
        <AnimatePresence mode="popLayout">
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* List header */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {items.length} {items.length === 1 ? 'imagem' : 'imagens'}
                  {doneItems.length > 0 && ` — ${doneItems.length} comprimida${doneItems.length !== 1 ? 's' : ''}`}
                </p>
                <Button
                  variant="ghost"
                  className="h-7 px-3 text-xs gap-1.5 text-text-secondary hover:text-error hover:border-error/40"
                  onClick={clearAll}
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar tudo
                </Button>
              </div>

              {/* Items */}
              <AnimatePresence mode="popLayout">
                {items.map(item => (
                  <CompressionItem key={item.id} item={item} onRemove={removeItem} />
                ))}
              </AnimatePresence>

              {/* Download all as ZIP */}
              {hasMultipleDone && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    className="w-full gap-2"
                    loading={downloadingZip}
                    onClick={handleDownloadZip}
                  >
                    <Download className="w-4 h-4" />
                    Baixar todas em ZIP ({doneItems.length} imagens)
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
