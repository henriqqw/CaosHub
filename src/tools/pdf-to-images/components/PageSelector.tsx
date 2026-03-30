import { cn } from '../../../lib/utils'

interface PageSelectorProps {
  pageCount: number
  selectedPages: number[]
  onToggle: (n: number) => void
}

export function PageSelector({ pageCount, selectedPages, onToggle }: PageSelectorProps) {
  const selectedSet = new Set(selectedPages)

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">
        {selectedPages.length === 0
          ? 'Nenhuma página selecionada'
          : `${selectedPages.length} página${selectedPages.length !== 1 ? 's' : ''} selecionada${selectedPages.length !== 1 ? 's' : ''}`}
      </p>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => {
          const isSelected = selectedSet.has(n)
          return (
            <button
              key={n}
              onClick={() => onToggle(n)}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border text-xs font-medium py-2 transition-colors duration-150 cursor-pointer',
                isSelected
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/50 hover:text-text-primary',
              )}
              title={`Página ${n}`}
            >
              <span className="text-[10px] leading-none mb-0.5 opacity-60">p</span>
              <span>{n}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
