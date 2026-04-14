import { useState, useRef, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, Download, Trash2, Upload } from 'lucide-react'
import { removeBackground } from '@imgly/background-removal'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, downloadBlob } from '../../lib/utils'

type Status = 'idle' | 'processing' | 'done' | 'error'

const BG_PRESETS = [
  { label: 'Transparente', value: 'transparent' },
  { label: 'Branco', value: '#ffffff' },
  { label: 'Preto', value: '#000000' },
  { label: 'Cinza', value: '#808080' },
]

export function BackgroundRemoval() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [bgColor, setBgColor] = useState('transparent')
  const [customColor, setCustomColor] = useState('#ffffff')
  const fileRef = useRef<File | null>(null)
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    if (resultBlob) {
      const name = (fileRef.current?.name ?? 'image').replace(/\.[^.]+$/, '') + '.png'
      downloadBlob(resultBlob, name)
    }
  }, [resultBlob])

  const processFile = async (file: File) => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)

    fileRef.current = file
    setOriginalUrl(URL.createObjectURL(file))
    setResultBlob(null)
    setResultUrl(null)
    setStatus('processing')
    setProgress(0)

    try {
      const blob = await removeBackground(file, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.round((current / total) * 100))
        },
      })
      const url = URL.createObjectURL(blob)
      setResultBlob(blob)
      setResultUrl(url)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
      toast({ type: 'error', message: 'Erro ao remover o fundo. Tente outra imagem.' })
    }
  }

  const handleFiles = (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ type: 'error', message: 'Selecione um arquivo de imagem.' })
      return
    }
    processFile(file)
  }

  const handleDownload = () => {
    if (!resultBlob || !fileRef.current) return
    const base = fileRef.current.name.replace(/\.[^.]+$/, '')
    downloadBlob(resultBlob, `${base}-sem-fundo.png`)
  }

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setOriginalUrl(null)
    setResultBlob(null)
    setResultUrl(null)
    setStatus('idle')
    setProgress(0)
    fileRef.current = null
  }

  const activeBg = bgColor === 'custom' ? customColor : bgColor

  return (
    <>
      <Helmet>
        <title>Remover Fundo de Imagem — IA no navegador | CaosHub</title>
        <meta
          name="description"
          content="Remova o fundo de qualquer imagem com IA, 100% no navegador. Sem upload para servidores, sem cadastro, gratuito."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/background-removal" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/background-removal" />
        <meta property="og:title" content="Remover Fundo de Imagem — CaosHub" />
        <meta
          property="og:description"
          content="Remova o fundo de qualquer imagem com IA, 100% no navegador. Sem upload para servidores."
        />
        <meta name="twitter:title" content="Remover Fundo de Imagem — CaosHub" />
        <meta
          name="twitter:description"
          content="Remova o fundo de qualquer imagem com IA, 100% no navegador. Sem upload para servidores."
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
            <Wand2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Remover Fundo</h1>
            <p className="text-text-secondary text-sm mt-1">
              Remove o fundo de imagens usando IA, 100% no navegador. Nenhum arquivo sai do seu dispositivo.
            </p>
          </div>
        </div>

        {/* Info banner (first load) */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-warning/20 bg-warning/5">
          <span className="text-warning text-xs mt-0.5">⚡</span>
          <p className="text-xs text-text-secondary leading-relaxed">
            Na primeira execução o modelo de IA (~50 MB) é baixado do CDN da IMG.LY.
            Isso é feito <strong className="text-text-primary">uma única vez</strong> e fica em cache no navegador.
          </p>
        </div>

        {/* Upload zone */}
        {status === 'idle' && (
          <FileUploadZone
            accept={['image/*', '.jpg', '.jpeg', '.png', '.webp']}
            onFiles={handleFiles}
            label="Arraste uma imagem aqui ou clique para selecionar"
            hint="JPEG, PNG, WebP — uma imagem por vez"
          />
        )}

        {/* Processing state */}
        <AnimatePresence>
          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-surface border border-border rounded-xl p-8 text-center space-y-4"
            >
              <div className="w-9 h-9 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-primary">
                  {progress < 5
                    ? 'Carregando modelo de IA...'
                    : progress < 95
                      ? 'Removendo fundo...'
                      : 'Finalizando...'}
                </p>
                <p className="text-xs text-text-secondary">
                  {progress < 5
                    ? 'Primeira vez pode levar ~30s para baixar o modelo'
                    : `${progress}% concluído`}
                </p>
              </div>
              {progress > 0 && (
                <div className="w-full max-w-xs mx-auto bg-border rounded-full h-1.5">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {status === 'done' && originalUrl && resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Before / After */}
              <div className="grid grid-cols-2 gap-3">
                {/* Original */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider text-center">
                    Original
                  </p>
                  <div className="rounded-xl border border-border bg-surface aspect-square flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                </div>

                {/* Result */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider text-center">
                    Sem fundo
                  </p>
                  <div
                    className="rounded-xl border border-border aspect-square flex items-center justify-center p-3 overflow-hidden"
                    style={{
                      background:
                        activeBg === 'transparent'
                          ? 'repeating-conic-gradient(#333 0% 25%, #1a1a1a 0% 50%) 0 0 / 16px 16px'
                          : activeBg,
                    }}
                  >
                    <img
                      src={resultUrl}
                      alt="Sem fundo"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Background picker */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Fundo da prévia
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {BG_PRESETS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setBgColor(value)}
                      title={label}
                      className={cn(
                        'w-7 h-7 rounded-md border-2 transition-colors duration-150',
                        bgColor === value ? 'border-accent' : 'border-border hover:border-accent/50',
                      )}
                      style={{
                        background:
                          value === 'transparent'
                            ? 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 8px 8px'
                            : value,
                      }}
                    />
                  ))}
                  {/* Custom color */}
                  <div className="relative">
                    <input
                      type="color"
                      value={customColor}
                      onChange={e => {
                        setCustomColor(e.target.value)
                        setBgColor('custom')
                      }}
                      className={cn(
                        'w-7 h-7 rounded-md border-2 cursor-pointer p-0.5 bg-transparent transition-colors duration-150',
                        bgColor === 'custom' ? 'border-accent' : 'border-border hover:border-accent/50',
                      )}
                      title="Cor personalizada"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                  Baixar PNG
                </Button>
                <Button variant="ghost" className="gap-2" onClick={handleReset}>
                  <Upload className="w-4 h-4" />
                  Nova imagem
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Tentar novamente
            </Button>
          </motion.div>
        )}
      </motion.div>
    </>
  )
}
