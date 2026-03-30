import { useState, useRef, useCallback, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, Download, RotateCcw, FlipHorizontal, FlipVertical, RotateCw, Crop } from 'lucide-react'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, formatBytes, downloadBlob } from '../../lib/utils'

type Tab = 'resize' | 'flip' | 'crop'
type OutputFormat = 'jpeg' | 'png' | 'webp'

interface Dimensions {
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function canvasToDataUrl(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): string {
  return canvas.toDataURL(`image/${format}`, quality / 100)
}

function estimateSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.round((base64.length * 3) / 4)
}

export function ImageEditor() {
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null)
  const [currentDataUrl, setCurrentDataUrl] = useState<string | null>(null)
  const [originalDims, setOriginalDims] = useState<Dimensions>({ width: 0, height: 0 })
  const [currentDims, setCurrentDims] = useState<Dimensions>({ width: 0, height: 0 })

  const [tab, setTab] = useState<Tab>('resize')

  // Resize state
  const [resizeW, setResizeW] = useState<number>(0)
  const [resizeH, setResizeH] = useState<number>(0)
  const [keepRatio, setKeepRatio] = useState<boolean>(true)
  const [percentMode, setPercentMode] = useState<boolean>(false)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg')
  const [quality, setQuality] = useState<number>(90)

  // Crop state
  const [cropX, setCropX] = useState<number>(0)
  const [cropY, setCropY] = useState<number>(0)
  const [cropW, setCropW] = useState<number>(0)
  const [cropH, setCropH] = useState<number>(0)

  // Result
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null)
  const [resultDims, setResultDims] = useState<Dimensions>({ width: 0, height: 0 })
  const [resultFormat, setResultFormat] = useState<OutputFormat>('jpeg')

  const [processing, setProcessing] = useState<boolean>(false)
  const { toasts, toast, dismiss } = useToast()
  const aspectRatioRef = useRef<number>(1)

  async function handleFiles(files: File[]) {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      const img = await loadImage(dataUrl)
      const dims = { width: img.naturalWidth, height: img.naturalHeight }
      aspectRatioRef.current = dims.width / dims.height
      setOriginalDataUrl(dataUrl)
      setCurrentDataUrl(dataUrl)
      setOriginalDims(dims)
      setCurrentDims(dims)
      setResizeW(dims.width)
      setResizeH(dims.height)
      setCropX(0)
      setCropY(0)
      setCropW(dims.width)
      setCropH(dims.height)
      setResultDataUrl(null)
    }
    reader.readAsDataURL(file)
  }

  // Keep resize W/H in sync when percentMode changes
  useEffect(() => {
    if (!currentDataUrl) return
    if (percentMode) {
      setResizeW(100)
      setResizeH(100)
    } else {
      setResizeW(currentDims.width)
      setResizeH(currentDims.height)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentMode])

  function handleResizeWChange(val: number) {
    setResizeW(val)
    if (keepRatio) {
      if (percentMode) {
        setResizeH(val)
      } else {
        setResizeH(Math.round(val / aspectRatioRef.current))
      }
    }
  }

  function handleResizeHChange(val: number) {
    setResizeH(val)
    if (keepRatio) {
      if (percentMode) {
        setResizeW(val)
      } else {
        setResizeW(Math.round(val * aspectRatioRef.current))
      }
    }
  }

  const applyResize = useCallback(async () => {
    if (!currentDataUrl) return
    setProcessing(true)
    try {
      const img = await loadImage(currentDataUrl)
      let newW: number
      let newH: number
      if (percentMode) {
        newW = Math.max(1, Math.round((img.naturalWidth * resizeW) / 100))
        newH = Math.max(1, Math.round((img.naturalHeight * resizeH) / 100))
      } else {
        newW = Math.max(1, resizeW)
        newH = Math.max(1, resizeH)
      }
      const canvas = document.createElement('canvas')
      canvas.width = newW
      canvas.height = newH
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, newW, newH)
      const dataUrl = canvasToDataUrl(canvas, outputFormat, quality)
      setCurrentDataUrl(dataUrl)
      setCurrentDims({ width: newW, height: newH })
      setResultDataUrl(dataUrl)
      setResultDims({ width: newW, height: newH })
      setResultFormat(outputFormat)
      toast({ type: 'success', message: `Redimensionado para ${newW}×${newH}px.` })
    } catch {
      toast({ type: 'error', message: 'Erro ao redimensionar a imagem.' })
    } finally {
      setProcessing(false)
    }
  }, [currentDataUrl, resizeW, resizeH, percentMode, outputFormat, quality, toast])

  const applyFlipH = useCallback(async () => {
    if (!currentDataUrl) return
    setProcessing(true)
    try {
      const img = await loadImage(currentDataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(img, -canvas.width, 0)
      ctx.restore()
      const dataUrl = canvasToDataUrl(canvas, outputFormat, quality)
      setCurrentDataUrl(dataUrl)
      setResultDataUrl(dataUrl)
      setResultDims({ width: canvas.width, height: canvas.height })
      setResultFormat(outputFormat)
      toast({ type: 'success', message: 'Imagem espelhada horizontalmente.' })
    } catch {
      toast({ type: 'error', message: 'Erro ao espelhar a imagem.' })
    } finally {
      setProcessing(false)
    }
  }, [currentDataUrl, outputFormat, quality, toast])

  const applyFlipV = useCallback(async () => {
    if (!currentDataUrl) return
    setProcessing(true)
    try {
      const img = await loadImage(currentDataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.save()
      ctx.scale(1, -1)
      ctx.drawImage(img, 0, -canvas.height)
      ctx.restore()
      const dataUrl = canvasToDataUrl(canvas, outputFormat, quality)
      setCurrentDataUrl(dataUrl)
      setResultDataUrl(dataUrl)
      setResultDims({ width: canvas.width, height: canvas.height })
      setResultFormat(outputFormat)
      toast({ type: 'success', message: 'Imagem espelhada verticalmente.' })
    } catch {
      toast({ type: 'error', message: 'Erro ao espelhar a imagem.' })
    } finally {
      setProcessing(false)
    }
  }, [currentDataUrl, outputFormat, quality, toast])

  const applyRotateCCW = useCallback(async () => {
    if (!currentDataUrl) return
    setProcessing(true)
    try {
      const img = await loadImage(currentDataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalHeight
      canvas.height = img.naturalWidth
      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
      const dataUrl = canvasToDataUrl(canvas, outputFormat, quality)
      setCurrentDataUrl(dataUrl)
      setCurrentDims({ width: canvas.width, height: canvas.height })
      setResultDataUrl(dataUrl)
      setResultDims({ width: canvas.width, height: canvas.height })
      setResultFormat(outputFormat)
      toast({ type: 'success', message: 'Rotacionado 90° à esquerda.' })
    } catch {
      toast({ type: 'error', message: 'Erro ao rotacionar a imagem.' })
    } finally {
      setProcessing(false)
    }
  }, [currentDataUrl, outputFormat, quality, toast])

  const applyRotateCW = useCallback(async () => {
    if (!currentDataUrl) return
    setProcessing(true)
    try {
      const img = await loadImage(currentDataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalHeight
      canvas.height = img.naturalWidth
      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(Math.PI / 2)
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
      const dataUrl = canvasToDataUrl(canvas, outputFormat, quality)
      setCurrentDataUrl(dataUrl)
      setCurrentDims({ width: canvas.width, height: canvas.height })
      setResultDataUrl(dataUrl)
      setResultDims({ width: canvas.width, height: canvas.height })
      setResultFormat(outputFormat)
      toast({ type: 'success', message: 'Rotacionado 90° à direita.' })
    } catch {
      toast({ type: 'error', message: 'Erro ao rotacionar a imagem.' })
    } finally {
      setProcessing(false)
    }
  }, [currentDataUrl, outputFormat, quality, toast])

  const applyReset = useCallback(() => {
    if (!originalDataUrl) return
    setCurrentDataUrl(originalDataUrl)
    setCurrentDims(originalDims)
    setResizeW(originalDims.width)
    setResizeH(originalDims.height)
    aspectRatioRef.current = originalDims.width / originalDims.height
    setCropX(0)
    setCropY(0)
    setCropW(originalDims.width)
    setCropH(originalDims.height)
    setResultDataUrl(null)
    toast({ type: 'success', message: 'Imagem resetada para o original.' })
  }, [originalDataUrl, originalDims, toast])

  const applyCrop = useCallback(async () => {
    if (!currentDataUrl) return
    const x = Math.max(0, cropX)
    const y = Math.max(0, cropY)
    const w = Math.max(1, Math.min(cropW, currentDims.width - x))
    const h = Math.max(1, Math.min(cropH, currentDims.height - y))
    setProcessing(true)
    try {
      const img = await loadImage(currentDataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
      const dataUrl = canvasToDataUrl(canvas, outputFormat, quality)
      setCurrentDataUrl(dataUrl)
      setCurrentDims({ width: w, height: h })
      setCropX(0)
      setCropY(0)
      setCropW(w)
      setCropH(h)
      setResultDataUrl(dataUrl)
      setResultDims({ width: w, height: h })
      setResultFormat(outputFormat)
      toast({ type: 'success', message: `Recortado para ${w}×${h}px.` })
    } catch {
      toast({ type: 'error', message: 'Erro ao recortar a imagem.' })
    } finally {
      setProcessing(false)
    }
  }, [currentDataUrl, cropX, cropY, cropW, cropH, currentDims, outputFormat, quality, toast])

  function handleDownload() {
    if (!resultDataUrl) return
    const ext = resultFormat
    const blob = dataUrlToBlob(resultDataUrl)
    downloadBlob(blob, `imagem-editada.${ext}`)
  }

  function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream'
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resize', label: 'Redimensionar' },
    { id: 'flip', label: 'Flip/Rotacionar' },
    { id: 'crop', label: 'Recortar' },
  ]

  const FORMAT_OPTIONS: { label: string; value: OutputFormat }[] = [
    { label: 'JPEG', value: 'jpeg' },
    { label: 'PNG', value: 'png' },
    { label: 'WebP', value: 'webp' },
  ]

  return (
    <>
      <Helmet>
        <title>Editor de Imagem — Redimensionar, Recortar e Espelhar | CaosHub</title>
        <meta
          name="description"
          content="Edite imagens no navegador: redimensione, espelhe, rotacione e recorte. Canvas API, 100% client-side, sem uploads."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/image-editor" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/image-editor" />
        <meta property="og:title" content="Editor de Imagem — CaosHub" />
        <meta
          property="og:description"
          content="Redimensione, espelhe, rotacione e recorte imagens no navegador. Nenhum arquivo sai do seu dispositivo."
        />
        <meta name="twitter:title" content="Editor de Imagem — CaosHub" />
        <meta
          name="twitter:description"
          content="Redimensione, espelhe, rotacione e recorte imagens no navegador. Nenhum arquivo sai do seu dispositivo."
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
            <SlidersHorizontal className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Editor de Imagem</h1>
            <p className="text-text-secondary text-sm mt-1">
              Redimensione, espelhe, rotacione e recorte imagens. Nenhum arquivo sai do seu dispositivo.
            </p>
          </div>
        </div>

        {/* Upload */}
        <FileUploadZone
          accept={['image/*', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']}
          multiple={false}
          onFiles={handleFiles}
          label="Arraste uma imagem aqui ou clique para selecionar"
          hint="JPEG, PNG, WebP, GIF, BMP"
        />

        {/* Original preview */}
        <AnimatePresence>
          {currentDataUrl && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Imagem atual
                </p>
                <span className="text-xs text-text-secondary">
                  {currentDims.width}×{currentDims.height}px
                </span>
              </div>
              <img
                src={currentDataUrl}
                alt="Atual"
                className="w-full max-h-64 object-contain rounded-lg bg-bg-primary"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs + operations */}
        <AnimatePresence>
          {currentDataUrl && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl overflow-hidden"
            >
              {/* Tab bar */}
              <div className="flex border-b border-border">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex-1 py-3 text-sm font-medium transition-colors duration-150',
                      tab === t.id
                        ? 'text-accent border-b-2 border-accent bg-accent/5'
                        : 'text-text-secondary hover:text-text-primary',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-4">
                {/* --- RESIZE TAB --- */}
                {tab === 'resize' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setKeepRatio(!keepRatio)}
                          className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                            keepRatio ? 'bg-accent border-accent' : 'bg-transparent border-border',
                          )}
                        >
                          {keepRatio && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-text-primary">Manter proporção</span>
                      </label>
                      <div className="ml-auto">
                        <button
                          onClick={() => setPercentMode(!percentMode)}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
                            percentMode
                              ? 'bg-accent/10 border-accent/30 text-accent'
                              : 'bg-transparent border-border text-text-secondary hover:border-accent/50',
                          )}
                        >
                          {percentMode ? '% Percentual' : 'px Pixels'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-text-secondary">
                          Largura {percentMode ? '(%)' : '(px)'}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={percentMode ? 1000 : 99999}
                          value={resizeW}
                          onChange={e => handleResizeWChange(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-secondary">
                          Altura {percentMode ? '(%)' : '(px)'}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={percentMode ? 1000 : 99999}
                          value={resizeH}
                          onChange={e => handleResizeHChange(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    </div>

                    {/* Format */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Formato de saída
                      </label>
                      <div className="flex gap-2">
                        {FORMAT_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setOutputFormat(opt.value)}
                            className={cn(
                              'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
                              outputFormat === opt.value
                                ? 'bg-accent border-accent text-white'
                                : 'bg-bg-primary border-border text-text-secondary hover:border-accent/50',
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality */}
                    {outputFormat !== 'png' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                            Qualidade
                          </label>
                          <span className="text-sm font-semibold text-text-primary">{quality}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={5}
                          value={quality}
                          onChange={e => setQuality(Number(e.target.value))}
                          className="w-full h-1.5 appearance-none rounded-full bg-border accent-accent cursor-pointer"
                        />
                      </div>
                    )}

                    <Button className="w-full" loading={processing} onClick={applyResize}>
                      Redimensionar
                    </Button>
                  </div>
                )}

                {/* --- FLIP/ROTATE TAB --- */}
                {tab === 'flip' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="ghost" loading={processing} onClick={applyFlipH} className="gap-2">
                        <FlipHorizontal className="w-4 h-4" />
                        Espelhar horizontal
                      </Button>
                      <Button variant="ghost" loading={processing} onClick={applyFlipV} className="gap-2">
                        <FlipVertical className="w-4 h-4" />
                        Espelhar vertical
                      </Button>
                      <Button variant="ghost" loading={processing} onClick={applyRotateCCW} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Rotacionar 90° esq.
                      </Button>
                      <Button variant="ghost" loading={processing} onClick={applyRotateCW} className="gap-2">
                        <RotateCw className="w-4 h-4" />
                        Rotacionar 90° dir.
                      </Button>
                    </div>
                    <Button variant="danger" onClick={applyReset} className="w-full gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Resetar para original
                    </Button>
                  </div>
                )}

                {/* --- CROP TAB --- */}
                {tab === 'crop' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'X (esquerda, px)', value: cropX, set: setCropX, max: currentDims.width - 1 },
                        { label: 'Y (topo, px)', value: cropY, set: setCropY, max: currentDims.height - 1 },
                        { label: 'Largura (px)', value: cropW, set: setCropW, max: currentDims.width },
                        { label: 'Altura (px)', value: cropH, set: setCropH, max: currentDims.height },
                      ].map(({ label, value, set, max }) => (
                        <div key={label} className="space-y-1">
                          <label className="text-xs text-text-secondary">{label}</label>
                          <input
                            type="number"
                            min={0}
                            max={max}
                            value={value}
                            onChange={e => set(Math.max(0, Math.min(max, Number(e.target.value))))}
                            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button className="flex-1 gap-2" loading={processing} onClick={applyCrop}>
                        <Crop className="w-4 h-4" />
                        Recortar
                      </Button>
                      <Button variant="danger" onClick={applyReset} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Resetar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {resultDataUrl && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Resultado</p>
                <span className="text-xs text-text-secondary">
                  {resultDims.width}×{resultDims.height}px · {formatBytes(estimateSize(resultDataUrl))}
                </span>
              </div>
              <img
                src={resultDataUrl}
                alt="Resultado"
                className="w-full max-h-64 object-contain rounded-lg bg-bg-primary"
              />
              <Button className="w-full gap-2" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                Baixar imagem ({resultFormat.toUpperCase()})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
