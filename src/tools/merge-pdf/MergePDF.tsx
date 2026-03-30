import { useState } from 'react'
import { motion } from 'framer-motion'
import { Merge, Plus } from 'lucide-react'
import { usePdfFiles } from './hooks/usePdfFiles'
import { PdfList } from './components/PdfList'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { mergePdfs } from './utils/mergePdfs'
import { downloadBlob } from '../../lib/utils'

export function MergePDF() {
  const { files, addFiles, removeFile, reorder } = usePdfFiles()
  const [merging, setMerging] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  const handleMerge = async () => {
    if (files.length < 2) return
    setMerging(true)
    try {
      const buffers = files.map(f => f.buffer)
      const bytes = await mergePdfs(buffers)
      const blob = new Blob([bytes as unknown as ArrayBuffer], { type: 'application/pdf' })
      downloadBlob(blob, 'merged.pdf')
      toast({ type: 'success', message: `Merged ${files.length} PDFs successfully.` })
    } catch {
      toast({ type: 'error', message: 'Failed to merge PDFs. Check that all files are valid.' })
    } finally {
      setMerging(false)
    }
  }

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
        <h1 className="text-2xl font-semibold text-text-primary">MergePDF</h1>
        <p className="text-text-secondary text-sm mt-1">
          Combine multiple PDFs into one. All processing happens in your browser.
        </p>
      </div>

      {/* Upload zone */}
      <FileUploadZone
        accept={['.pdf', 'application/pdf']}
        multiple
        onFiles={addFiles}
        label="Drop PDF files here or click to browse"
        hint="PDF files only"
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {files.length} file{files.length !== 1 ? 's' : ''} — drag to reorder
            </p>
            <Button
              variant="ghost"
              className="text-xs gap-1.5"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
            >
              <Plus className="w-3.5 h-3.5" />
              Add more
            </Button>
          </div>

          <PdfList files={files} onRemove={removeFile} onReorder={reorder} />

          <Button
            className="w-full mt-2"
            loading={merging}
            disabled={files.length < 2}
            onClick={handleMerge}
          >
            <Merge className="w-4 h-4" />
            {merging ? 'Merging…' : `Merge ${files.length} PDFs`}
          </Button>

          {files.length < 2 && (
            <p className="text-xs text-text-secondary text-center">Add at least 2 PDFs to merge</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
