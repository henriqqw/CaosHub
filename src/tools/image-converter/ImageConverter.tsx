import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FolderArchive } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useImageConverter } from './hooks/useImageConverter'
import { ConversionList } from './components/ConversionList'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { dataUrlToBlob } from '../../lib/utils'
import { type OutputFormat, formatExt } from './utils/convertImage'

const IMAGE_ACCEPT = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.gif', 'image/*']

const FORMAT_OPTIONS: { label: string; value: OutputFormat; note?: string }[] = [
  { label: 'JPEG', value: 'jpeg', note: 'lossy, smallest size' },
  { label: 'PNG', value: 'png', note: 'lossless, larger size' },
  { label: 'WebP', value: 'webp', note: 'lossy/lossless, smallest' },
]

export function ImageConverter() {
  const { items, outputFormat, quality, addFiles, removeItem, setOutputFormat, setQuality } =
    useImageConverter()
  const [zipping, setZipping] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  const doneItems = items.filter(i => i.status === 'done' && i.result)
  const showQuality = outputFormat !== 'png'

  const downloadAll = async () => {
    if (!doneItems.length) return
    setZipping(true)
    try {
      const zip = new JSZip()
      doneItems.forEach(item => {
        const blob = dataUrlToBlob(item.result!.dataUrl)
        const name = item.file.name.replace(/\.[^.]+$/, '') + '.' + formatExt(outputFormat)
        zip.file(name, blob)
      })
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `converted-images.zip`)
    } catch {
      toast({ type: 'error', message: 'Failed to create ZIP archive.' })
    } finally {
      setZipping(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Image Converter — Converta imagens para JPEG, PNG e WebP | CaosHub</title>
        <meta name="description" content="Converta imagens entre JPEG, PNG e WebP diretamente no navegador. Sem upload para servidores, controle de qualidade, download em ZIP. 100% gratuito e privado." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/image-converter" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/image-converter" />
        <meta property="og:title" content="Image Converter — Converta imagens para JPEG, PNG e WebP | CaosHub" />
        <meta property="og:description" content="Converta imagens entre JPEG, PNG e WebP diretamente no navegador. Sem upload, controle de qualidade, download em ZIP. 100% gratuito e privado." />
        <meta name="twitter:title" content="Image Converter — Converta imagens para JPEG, PNG e WebP | CaosHub" />
        <meta name="twitter:description" content="Converta imagens entre JPEG, PNG e WebP diretamente no navegador. Sem upload, controle de qualidade, download em ZIP. 100% gratuito." />
      </Helmet>
      <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto px-4 pb-12 space-y-6"
    >
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Image Converter</h1>
        <p className="text-text-secondary text-sm mt-1">
          Convert images between JPEG, PNG, and WebP. All processing happens in your browser.
        </p>
      </div>

      {/* Output format selector */}
      <div className="rounded-xl bg-bg-secondary border border-border p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
            Output Format
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-lg border border-border">
            {FORMAT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setOutputFormat(opt.value)}
                className={`py-2 px-3 rounded-md text-xs font-medium transition-colors duration-100 text-center ${
                  outputFormat === opt.value
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <div>{opt.label}</div>
                {opt.note && (
                  <div className={`text-[10px] mt-0.5 ${outputFormat === opt.value ? 'text-white/70' : 'text-text-secondary/60'}`}>
                    {opt.note}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quality slider */}
        {showQuality && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
                Quality
              </label>
              <span className="text-sm font-semibold text-accent">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={Math.round(quality * 100)}
              onChange={e => setQuality(parseInt(e.target.value) / 100)}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-text-secondary">
              <span>10% — smallest file</span>
              <span>100% — best quality</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload zone */}
      <FileUploadZone
        accept={IMAGE_ACCEPT}
        multiple
        onFiles={addFiles}
        label="Drop images here or click to browse"
        hint="JPEG, PNG, WebP, BMP, TIFF, GIF"
      />

      {/* List */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {doneItems.length}/{items.length} converted
            </p>
            {doneItems.length > 1 && (
              <Button loading={zipping} onClick={downloadAll} className="text-xs gap-1.5">
                <FolderArchive className="w-3.5 h-3.5" />
                Download all as ZIP
              </Button>
            )}
          </div>
          <ConversionList items={items} outputFormat={outputFormat} onRemove={removeItem} />
        </div>
      )}
    </motion.div>
    </>
  )
}
