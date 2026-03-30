import { Download, FolderArchive, RotateCcw } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Button } from '../../../components/ui/Button'
import { dataUrlToBlob, downloadBlob } from '../../../lib/utils'
import { useState } from 'react'

interface FrameResultsProps {
  frames: string[]
  format: 'png' | 'jpeg'
  onReset: () => void
}

export function FrameResults({ frames, format, onReset }: FrameResultsProps) {
  const [zipping, setZipping] = useState(false)
  const ext = format === 'png' ? 'png' : 'jpg'

  const downloadOne = (dataUrl: string, index: number) => {
    const blob = dataUrlToBlob(dataUrl)
    downloadBlob(blob, `frame_${String(index + 1).padStart(4, '0')}.${ext}`)
  }

  const downloadAll = async () => {
    setZipping(true)
    try {
      const zip = new JSZip()
      frames.forEach((dataUrl, i) => {
        const blob = dataUrlToBlob(dataUrl)
        zip.file(`frame_${String(i + 1).padStart(4, '0')}.${ext}`, blob)
      })
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `frames.zip`)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {frames.length} frame{frames.length !== 1 ? 's' : ''} extracted
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onReset} className="text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            New extraction
          </Button>
          <Button loading={zipping} onClick={downloadAll} className="text-xs gap-1.5">
            <FolderArchive className="w-3.5 h-3.5" />
            Download ZIP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {frames.map((frame, i) => (
          <div
            key={i}
            className="group relative aspect-video rounded-lg overflow-hidden border border-border bg-surface cursor-pointer"
            onClick={() => downloadOne(frame, i)}
          >
            <img src={frame} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
