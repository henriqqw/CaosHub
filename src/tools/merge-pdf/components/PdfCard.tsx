import { Draggable } from '@hello-pangea/dnd'
import { GripVertical, X, FileText } from 'lucide-react'
import { type PdfFile } from '../hooks/usePdfFiles'
import { formatBytes } from '../../../lib/utils'

interface PdfCardProps {
  file: PdfFile
  index: number
  onRemove: (id: string) => void
}

export function PdfCard({ file, index, onRemove }: PdfCardProps) {
  return (
    <Draggable draggableId={file.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors duration-100 ${
            snapshot.isDragging
              ? 'bg-accent/10 border-accent/40 shadow-lg'
              : 'bg-surface border-border'
          }`}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            className="text-text-secondary hover:text-text-primary cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Thumbnail */}
          <div className="w-10 h-12 rounded overflow-hidden bg-bg-secondary border border-border flex items-center justify-center shrink-0">
            {file.thumbnail ? (
              <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              <FileText className="w-5 h-5 text-text-secondary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{file.name}</p>
            <p className="text-xs text-text-secondary">{formatBytes(file.size)}</p>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(file.id)}
            className="text-text-secondary hover:text-error transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </Draggable>
  )
}
