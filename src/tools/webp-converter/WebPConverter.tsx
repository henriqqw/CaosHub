import { useState } from 'react'
import { motion } from 'framer-motion'
import { FolderArchive } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useWebPConverter } from './hooks/useWebPConverter'
import { ConversionList } from './components/ConversionList'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { dataUrlToBlob } from '../../lib/utils'

const IMAGE_ACCEPT = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', 'image/*']

export function WebPConverter() {
  const { items, quality, setQuality, addFiles, removeItem, reconvertAll } = useWebPConverter()
  const [zipping, setZipping] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  const downloadAll = async () => {
    const done = items.filter(i => i.status === 'done' && i.webpDataUrl)
    if (!done.length) return
    setZipping(true)
    try {
      const zip = new JSZip()
      done.forEach(item => {
        const blob = dataUrlToBlob(item.webpDataUrl!)
        const name = item.file.name.replace(/\.[^.]+$/, '') + '.webp'
        zip.file(name, blob)
      })
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'webp-images.zip')
    } catch {
      toast({ type: 'error', message: 'Failed to create ZIP.' })
    } finally {
      setZipping(false)
    }
  }

  const doneCount = items.filter(i => i.status === 'done').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">WebP Converter</h1>
        <p className="text-text-secondary text-sm mt-1">
          Convert images to WebP format. All processing happens in your browser.
        </p>
      </div>

      {/* Upload zone */}
      <FileUploadZone
        accept={IMAGE_ACCEPT}
        multiple
        onFiles={addFiles}
        label="Drop images here or click to browse"
        hint="JPEG, PNG, BMP, TIFF, GIF"
      />

      {/* Quality control */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Quality
            </label>
            <span className="text-xs text-accent font-medium">{Math.round(quality * 100)}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={Math.round(quality * 100)}
            onChange={e => setQuality(parseInt(e.target.value) / 100)}
            onMouseUp={reconvertAll}
            onTouchEnd={reconvertAll}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-text-secondary">
            <span>10% (smallest)</span>
            <span>100% (lossless)</span>
          </div>
        </div>
      )}

      {/* List */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {doneCount}/{items.length} converted
            </p>
            {doneCount > 1 && (
              <Button
                loading={zipping}
                className="text-xs gap-1.5"
                onClick={downloadAll}
              >
                <FolderArchive className="w-3.5 h-3.5" />
                Download all as ZIP
              </Button>
            )}
          </div>
          <ConversionList items={items} onRemove={removeItem} />
        </div>
      )}
    </motion.div>
  )
}
