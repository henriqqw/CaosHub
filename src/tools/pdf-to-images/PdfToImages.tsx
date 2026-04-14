import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FileImage, Download, RotateCcw, Image, Archive } from 'lucide-react'
import JSZip from 'jszip'
import { usePdfToImages } from './hooks/usePdfToImages'
import { PageSelector } from './components/PageSelector'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { downloadBlob, cn } from '../../lib/utils'
import type { ImageFormat } from './utils/pdfToImages'

export function PdfToImages() {
  const {
    phase,
    pdfFile,
    pageCount,
    selectedPages,
    format,
    quality,
    scale,
    progress,
    images,
    loadPdf,
    togglePage,
    selectAll,
    selectNone,
    setFormat,
    setQuality,
    setScale,
    render,
    reset,
  } = usePdfToImages()

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

  const handleRender = async () => {
    if (selectedPages.length === 0) {
      toast({ type: 'warning', message: 'Selecione ao menos uma página para converter.' })
      return
    }
    try {
      await render()
      toast({ type: 'success', message: `${selectedPages.length} página${selectedPages.length !== 1 ? 's' : ''} convertida${selectedPages.length !== 1 ? 's' : ''} com sucesso!` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast({ type: 'error', message: `Erro ao converter: ${msg}` })
    }
  }

  const handleDownloadOne = (dataUrl: string, pageNumber: number) => {
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    const baseName = pdfFile?.name.replace(/\.pdf$/i, '') ?? 'pagina'
    fetch(dataUrl)
      .then(r => r.blob())
      .then(blob => downloadBlob(blob, `${baseName}-pagina-${pageNumber}.${ext}`))
      .catch(() => toast({ type: 'error', message: 'Erro ao baixar imagem.' }))
  }

  const handleDownloadAll = async () => {
    if (images.length === 0) return
    try {
      const zip = new JSZip()
      const ext = format === 'jpeg' ? 'jpg' : 'png'
      const baseName = pdfFile?.name.replace(/\.pdf$/i, '') ?? 'pdf'

      for (const img of images) {
        const response = await fetch(img.dataUrl)
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        zip.file(`${baseName}-pagina-${img.pageNumber}.${ext}`, arrayBuffer)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(zipBlob, `${baseName}-imagens.zip`)
      toast({ type: 'success', message: 'ZIP baixado com sucesso!' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast({ type: 'error', message: `Erro ao criar ZIP: ${msg}` })
    }
  }

  useEffect(() => {
    if (phase === 'done' && images.length > 0) void handleDownloadAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const scaleOptions: { value: number; label: string }[] = [
    { value: 1, label: '1×' },
    { value: 2, label: '2×' },
    { value: 3, label: '3×' },
  ]

  const formatOptions: { value: ImageFormat; label: string }[] = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPEG' },
  ]

  return (
    <>
      <Helmet>
        <title>PDF para Imagens — Converta páginas de PDF em PNG/JPEG | CaosHub</title>
        <meta
          name="description"
          content="Converta páginas de PDF em imagens PNG ou JPEG diretamente no navegador. Sem upload para servidores, 100% gratuito e privado."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/pdf-to-images" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/pdf-to-images" />
        <meta property="og:title" content="PDF para Imagens | CaosHub" />
        <meta property="og:description" content="Converta páginas de PDF em imagens PNG ou JPEG. 100% no navegador." />
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
            <FileImage className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-semibold text-text-primary">PDF para Imagens</h1>
          </div>
          <p className="text-text-secondary text-sm">
            Converta páginas de PDF em PNG ou JPEG. Todo o processamento acontece no seu navegador.
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

        {/* Loaded / options */}
        {(phase === 'loaded' || phase === 'rendering') && pdfFile && (
          <div className="space-y-5">
            {/* File info */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <FileImage className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm text-text-primary truncate">{pdfFile.name}</span>
              </div>
              <span className="text-xs text-text-secondary shrink-0 ml-3">
                {pageCount} página{pageCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Page selector */}
            <div className="space-y-3 p-4 rounded-xl bg-surface border border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-text-primary">Selecionar páginas</h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    Selecionar todas
                  </button>
                  <span className="text-xs text-border">|</span>
                  <button
                    onClick={selectNone}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Desmarcar todas
                  </button>
                </div>
              </div>
              <PageSelector
                pageCount={pageCount}
                selectedPages={selectedPages}
                onToggle={togglePage}
              />
            </div>

            {/* Options */}
            <div className="p-4 rounded-xl bg-surface border border-border space-y-4">
              <h2 className="text-sm font-medium text-text-primary">Opções de exportação</h2>

              {/* Format */}
              <div className="space-y-2">
                <label className="text-xs text-text-secondary">Formato</label>
                <div className="flex gap-2">
                  {formatOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFormat(opt.value)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150',
                        format === opt.value
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'bg-bg-secondary border-border text-text-secondary hover:border-accent/50',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality — JPEG only */}
              {format === 'jpeg' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs text-text-secondary">Qualidade</label>
                    <span className="text-xs text-text-primary font-medium">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1}
                    step={0.05}
                    value={quality}
                    onChange={e => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-text-secondary">
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {/* Scale */}
              <div className="space-y-2">
                <label className="text-xs text-text-secondary">Resolução</label>
                <div className="flex gap-2">
                  {scaleOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setScale(opt.value)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150',
                        scale === opt.value
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'bg-bg-secondary border-border text-text-secondary hover:border-accent/50',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-text-secondary">
                  {scale === 1 ? 'Baixa resolução — menor arquivo' : scale === 2 ? 'Alta qualidade — recomendado' : 'Máxima qualidade — arquivo maior'}
                </p>
              </div>
            </div>

            {/* Render button */}
            {phase === 'loaded' && (
              <Button
                className="w-full"
                disabled={selectedPages.length === 0}
                onClick={handleRender}
              >
                <Image className="w-4 h-4" />
                Converter {selectedPages.length} página{selectedPages.length !== 1 ? 's' : ''}
              </Button>
            )}

            {/* Progress */}
            {phase === 'rendering' && (
              <div className="space-y-2">
                <ProgressBar value={progress} label="Convertendo páginas..." />
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {phase === 'done' && images.length > 0 && (
          <div className="space-y-5">
            {/* Summary bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                <span className="text-text-primary font-medium">{images.length}</span> imagen{images.length !== 1 ? 's' : ''} gerada{images.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" className="text-xs gap-1.5" onClick={handleDownloadAll}>
                  <Archive className="w-3.5 h-3.5" />
                  Baixar todas como ZIP
                </Button>
                <Button variant="ghost" className="text-xs gap-1.5" onClick={reset}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Converter outro
                </Button>
              </div>
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map(img => (
                <div
                  key={img.pageNumber}
                  className="group rounded-xl overflow-hidden border border-border bg-surface hover:border-accent/40 transition-colors duration-150"
                >
                  <div className="aspect-[3/4] bg-bg-primary overflow-hidden">
                    <img
                      src={img.dataUrl}
                      alt={`Página ${img.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      Pág. {img.pageNumber}
                    </span>
                    <button
                      onClick={() => handleDownloadOne(img.dataUrl, img.pageNumber)}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Baixar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom reset */}
            <Button variant="ghost" className="w-full" onClick={reset}>
              <RotateCcw className="w-4 h-4" />
              Converter outro PDF
            </Button>
          </div>
        )}
      </motion.div>
    </>
  )
}
