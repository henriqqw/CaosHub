import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  Scissors,
  FileText,
  Layers,
  Grid3X3,
  Download,
  RotateCcw,
  Archive,
  ChevronRight,
} from 'lucide-react'
import JSZip from 'jszip'
import { usePdfSplitter, type SplitMode } from './hooks/usePdfSplitter'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { downloadBlob, formatBytes, cn } from '../../lib/utils'

interface ModeCardProps {
  icon: React.ReactNode
  title: string
  description: string
  active: boolean
  onClick: () => void
}

function ModeCard({ icon, title, description, active, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-left w-full transition-colors duration-150 cursor-pointer',
        active
          ? 'border-accent bg-accent/5'
          : 'border-border bg-surface hover:border-accent/40',
      )}
    >
      <div
        className={cn(
          'p-2 rounded-lg border shrink-0',
          active ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-bg-secondary border-border text-text-secondary',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-medium', active ? 'text-text-primary' : 'text-text-secondary')}>
          {title}
        </p>
        <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{description}</p>
      </div>
      {active && <ChevronRight className="w-4 h-4 text-accent shrink-0 ml-auto mt-0.5" />}
    </button>
  )
}

const SPLIT_MODES: { value: SplitMode; icon: React.ReactNode; title: string; description: string }[] = [
  {
    value: 'all',
    icon: <Layers className="w-4 h-4" />,
    title: 'Dividir em páginas',
    description: 'Gera um arquivo PDF separado para cada página.',
  },
  {
    value: 'range',
    icon: <Grid3X3 className="w-4 h-4" />,
    title: 'Dividir por blocos',
    description: 'Agrupa as páginas em blocos de N páginas, cada bloco vira um PDF.',
  },
  {
    value: 'custom',
    icon: <Scissors className="w-4 h-4" />,
    title: 'Extrair páginas',
    description: 'Selecione páginas específicas e exporte como um único PDF.',
  },
]

export function PdfSplitter() {
  const {
    phase,
    pdfFile,
    pageCount,
    splitMode,
    chunkSize,
    selectedPages,
    results,
    splitting,
    loadPdf,
    setSplitMode,
    setChunkSize,
    togglePage,
    split,
    reset,
  } = usePdfSplitter()

  const { toasts, toast, dismiss } = useToast()

  const handleFiles = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    try {
      await loadPdf(file)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast({ type: 'error', message: `Erro ao carregar PDF: ${msg}` })
    }
  }

  const handleSplit = async () => {
    if (splitMode === 'custom' && selectedPages.length === 0) {
      toast({ type: 'warning', message: 'Selecione ao menos uma página para extrair.' })
      return
    }
    try {
      await split()
      toast({ type: 'success', message: 'PDF dividido com sucesso!' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast({ type: 'error', message: `Erro ao dividir: ${msg}` })
    }
  }

  const handleDownloadOne = (index: number) => {
    const result = results[index]
    if (!result) return
    downloadBlob(result.blob, result.name)
  }

  const handleDownloadAll = async () => {
    if (results.length === 0) return
    try {
      const zip = new JSZip()
      for (const result of results) {
        const arrayBuffer = await result.blob.arrayBuffer()
        zip.file(result.name, arrayBuffer)
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const baseName = pdfFile?.name.replace(/\.pdf$/i, '') ?? 'pdf'
      downloadBlob(zipBlob, `${baseName}-partes.zip`)
      toast({ type: 'success', message: 'ZIP baixado com sucesso!' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast({ type: 'error', message: `Erro ao criar ZIP: ${msg}` })
    }
  }

  // Preview how many files range mode will produce
  const rangePreviewCount = (() => {
    if (splitMode !== 'range' || pageCount === 0) return 0
    const safe = Math.max(1, chunkSize)
    return Math.ceil(pageCount / safe)
  })()

  return (
    <>
      <Helmet>
        <title>Dividir PDF — Separe páginas de PDF gratuitamente | CaosHub</title>
        <meta
          name="description"
          content="Divida PDFs em páginas individuais, blocos ou extraia páginas específicas. 100% no navegador, sem upload para servidores."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/pdf-splitter" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/pdf-splitter" />
        <meta property="og:title" content="Dividir PDF | CaosHub" />
        <meta property="og:description" content="Divida PDFs em páginas individuais, blocos ou extraia páginas específicas. 100% no navegador." />
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
          <div className="flex items-center gap-2 mb-1">
            <Scissors className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-semibold text-text-primary">Dividir PDF</h1>
          </div>
          <p className="text-text-secondary text-sm">
            Separe páginas, crie blocos ou extraia partes do seu PDF. Tudo no navegador.
          </p>
        </div>

        {/* Upload */}
        {phase === 'idle' && (
          <FileUploadZone
            accept={['.pdf', 'application/pdf']}
            multiple={false}
            onFiles={handleFiles}
            label="Arraste um PDF aqui ou clique para selecionar"
            hint="Apenas arquivos PDF"
          />
        )}

        {/* Loaded state */}
        {(phase === 'loaded' || phase === 'splitting') && pdfFile && (
          <div className="space-y-5">
            {/* File info */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm text-text-primary truncate">{pdfFile.name}</span>
              </div>
              <span className="text-xs text-text-secondary shrink-0 ml-3">
                {pageCount} página{pageCount !== 1 ? 's' : ''} carregada{pageCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Mode selector */}
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-text-primary">Modo de divisão</h2>
              <div className="space-y-2">
                {SPLIT_MODES.map(mode => (
                  <ModeCard
                    key={mode.value}
                    icon={mode.icon}
                    title={mode.title}
                    description={mode.description}
                    active={splitMode === mode.value}
                    onClick={() => setSplitMode(mode.value)}
                  />
                ))}
              </div>
            </div>

            {/* Range chunk input */}
            {splitMode === 'range' && (
              <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Páginas por bloco
                  </label>
                  <span className="text-xs text-text-secondary">
                    {rangePreviewCount > 0 && `Gerará ${rangePreviewCount} arquivo${rangePreviewCount !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={chunkSize}
                    onChange={e => setChunkSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-20 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm focus:border-accent focus:outline-none"
                  />
                  <span className="text-sm text-text-secondary">
                    página{chunkSize !== 1 ? 's' : ''} por arquivo
                  </span>
                </div>
              </div>
            )}

            {/* Custom page selector */}
            {splitMode === 'custom' && (
              <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-text-primary">Selecionar páginas</h2>
                  <span className="text-xs text-text-secondary">
                    {selectedPages.length > 0
                      ? `${selectedPages.length} selecionada${selectedPages.length !== 1 ? 's' : ''}`
                      : 'Nenhuma selecionada'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => {
                    const isSelected = selectedPages.includes(n)
                    return (
                      <button
                        key={n}
                        onClick={() => togglePage(n)}
                        className={cn(
                          'w-10 h-10 rounded-lg border text-sm font-medium transition-colors duration-150 cursor-pointer',
                          isSelected
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/50 hover:text-text-primary',
                        )}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Split button */}
            {phase === 'loaded' && (
              <Button
                className="w-full"
                loading={splitting}
                disabled={splitMode === 'custom' && selectedPages.length === 0}
                onClick={handleSplit}
              >
                <Scissors className="w-4 h-4" />
                Dividir PDF
              </Button>
            )}

            {phase === 'splitting' && (
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-text-secondary">Dividindo PDF...</span>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {phase === 'done' && results.length > 0 && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                <span className="text-text-primary font-medium">{results.length}</span> arquivo{results.length !== 1 ? 's' : ''} gerado{results.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                {results.length > 1 && (
                  <Button variant="ghost" className="text-xs gap-1.5" onClick={handleDownloadAll}>
                    <Archive className="w-3.5 h-3.5" />
                    Baixar todos como ZIP
                  </Button>
                )}
                <Button variant="ghost" className="text-xs gap-1.5" onClick={reset}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Novo PDF
                </Button>
              </div>
            </div>

            {/* Results list */}
            <div className="space-y-2">
              {results.map((result, i) => (
                <motion.div
                  key={result.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.04 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
                      <FileText className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary truncate">{result.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {result.pageCount} página{result.pageCount !== 1 ? 's' : ''} · {formatBytes(result.blob.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-xs gap-1.5 shrink-0 ml-3"
                    onClick={() => handleDownloadOne(i)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Bottom reset */}
            <Button variant="ghost" className="w-full" onClick={reset}>
              <RotateCcw className="w-4 h-4" />
              Dividir outro PDF
            </Button>
          </div>
        )}
      </motion.div>
    </>
  )
}
