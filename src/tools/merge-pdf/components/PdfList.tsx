import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import { PdfCard } from './PdfCard'
import { type PdfFile } from '../hooks/usePdfFiles'

interface PdfListProps {
  files: PdfFile[]
  onRemove: (id: string) => void
  onReorder: (startIndex: number, endIndex: number) => void
}

export function PdfList({ files, onRemove, onReorder }: PdfListProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    onReorder(result.source.index, result.destination.index)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="pdf-list">
        {provided => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <PdfCard
                key={file.id}
                file={file}
                index={index}
                onRemove={onRemove}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
