import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Download } from 'lucide-react'
import JSZip from 'jszip'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, downloadBlob } from '../../lib/utils'

const ALL_SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512] as const
type FaviconSize = typeof ALL_SIZES[number]

interface FaviconResult {
  size: FaviconSize
  dataUrl: string
  blob: Blob
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function generateFavicon(img: HTMLImageElement, size: FaviconSize): Promise<FaviconResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, size, size)
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('toBlob failed')); return }
      const dataUrl = canvas.toDataURL('image/png')
      resolve({ size, dataUrl, blob })
    }, 'image/png')
  })
}

export function FaviconGenerator() {
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<Set<FaviconSize>>(new Set(ALL_SIZES))
  const [results, setResults] = useState<FaviconResult[]>([])
  const [generating, setGenerating] = useState<boolean>(false)
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false)
  const { toasts, toast, dismiss } = useToast()

  function handleFiles(files: File[]) {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setSourceDataUrl(e.target?.result as string)
      setResults([])
    }
    reader.readAsDataURL(file)
  }

  function toggleSize(size: FaviconSize) {
    setSelectedSizes(prev => {
      const next = new Set(prev)
      if (next.has(size)) {
        if (next.size > 1) next.delete(size)
      } else {
        next.add(size)
      }
      return next
    })
  }

  function toggleAll() {
    if (selectedSizes.size === ALL_SIZES.length) {
      setSelectedSizes(new Set([ALL_SIZES[0]]))
    } else {
      setSelectedSizes(new Set(ALL_SIZES))
    }
  }

  async function handleGenerate() {
    if (!sourceDataUrl) return
    setGenerating(true)
    try {
      const img = await loadImage(sourceDataUrl)
      const sizesToProcess = ALL_SIZES.filter(s => selectedSizes.has(s))
      const generated = await Promise.all(sizesToProcess.map(size => generateFavicon(img, size)))
      setResults(generated)
      toast({ type: 'success', message: `${generated.length} favicon${generated.length !== 1 ? 's' : ''} gerado${generated.length !== 1 ? 's' : ''}!` })
    } catch {
      toast({ type: 'error', message: 'Erro ao gerar favicons.' })
    } finally {
      setGenerating(false)
    }
  }

  function handleDownloadOne(result: FaviconResult) {
    downloadBlob(result.blob, `favicon-${result.size}x${result.size}.png`)
  }

  async function handleDownloadZip() {
    if (results.length === 0) return
    setDownloadingZip(true)
    try {
      const zip = new JSZip()
      for (const result of results) {
        zip.file(`favicon-${result.size}x${result.size}.png`, result.blob)
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(zipBlob, 'favicons.zip')
      toast({ type: 'success', message: 'ZIP baixado com sucesso!' })
    } catch {
      toast({ type: 'error', message: 'Erro ao gerar o ZIP.' })
    } finally {
      setDownloadingZip(false)
    }
  }

  const allSelected = selectedSizes.size === ALL_SIZES.length

  return (
    <>
      <Helmet>
        <title>Gerador de Favicon — Todos os tamanhos em um clique | CaosHub</title>
        <meta
          name="description"
          content="Gere favicons em todos os tamanhos padrão (16px a 512px) diretamente no navegador. Export individual ou em ZIP. Nenhum arquivo sai do seu dispositivo."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/favicon-generator" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/favicon-generator" />
        <meta property="og:title" content="Gerador de Favicon — CaosHub" />
        <meta
          property="og:description"
          content="Gere favicons em todos os tamanhos padrão no navegador. Nenhum arquivo sai do seu dispositivo."
        />
        <meta name="twitter:title" content="Gerador de Favicon — CaosHub" />
        <meta
          name="twitter:description"
          content="Gere favicons em todos os tamanhos padrão no navegador. Nenhum arquivo sai do seu dispositivo."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 py-8 pb-12 space-y-6"
      >
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
            <Layers className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Gerador de Favicon</h1>
            <p className="text-text-secondary text-sm mt-1">
              Gere favicons em todos os tamanhos padrão. Nenhum arquivo sai do seu dispositivo.
            </p>
          </div>
        </div>

        {/* Upload */}
        <FileUploadZone
          accept={['image/*']}
          multiple={false}
          onFiles={handleFiles}
          label="Arraste a imagem aqui ou clique para selecionar"
          hint="Qualquer formato de imagem — recomendado: PNG quadrado"
        />

        {/* Source preview */}
        <AnimatePresence>
          {sourceDataUrl && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <img
                src={sourceDataUrl}
                alt="Fonte"
                className="w-16 h-16 object-contain rounded-lg bg-bg-primary border border-border"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Imagem carregada</p>
                <p className="text-xs text-text-secondary">Pronta para gerar favicons</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Size selector */}
        <AnimatePresence>
          {sourceDataUrl && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-text-primary">Tamanhos</h2>
                <button
                  onClick={toggleAll}
                  className="text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map(size => {
                  const isSelected = selectedSizes.has(size)
                  const isApple = size === 180
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150',
                        isSelected
                          ? 'bg-accent/10 border-accent/40 text-accent'
                          : 'bg-bg-primary border-border text-text-secondary hover:border-accent/40 hover:text-text-primary',
                      )}
                    >
                      {size}×{size}
                      {isApple && <span className="ml-1 opacity-60">Apple</span>}
                    </button>
                  )
                })}
              </div>

              <Button
                className="w-full"
                loading={generating}
                disabled={selectedSizes.size === 0}
                onClick={handleGenerate}
              >
                <Layers className="w-4 h-4" />
                Gerar Favicons ({selectedSizes.size} tamanho{selectedSizes.size !== 1 ? 's' : ''})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Preview grid */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-medium text-text-primary">Favicons gerados</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {results.map(result => (
                    <div
                      key={result.size}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-bg-primary border border-border"
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-surface rounded">
                        <img
                          src={result.dataUrl}
                          alt={`${result.size}×${result.size}`}
                          style={{ width: Math.min(result.size, 48), height: Math.min(result.size, 48) }}
                          className="object-contain"
                        />
                      </div>
                      <p className="text-xs text-text-secondary font-medium">
                        {result.size}×{result.size}
                        {result.size === 180 && <span className="block text-center opacity-60">Apple Touch</span>}
                      </p>
                      <button
                        onClick={() => handleDownloadOne(result)}
                        className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Baixar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download ZIP */}
              <Button className="w-full gap-2" loading={downloadingZip} onClick={handleDownloadZip}>
                <Download className="w-4 h-4" />
                Baixar todos em ZIP ({results.length} arquivos)
              </Button>

              {/* ICO note */}
              <p className="text-xs text-text-secondary text-center">
                Para <span className="font-mono">.ico</span>: faça upload do 32×32 PNG em{' '}
                <a
                  href="https://realfavicongenerator.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  realfavicongenerator.net
                </a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
