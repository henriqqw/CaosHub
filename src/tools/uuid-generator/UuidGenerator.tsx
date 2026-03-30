import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle, Copy, Download, CheckCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, downloadBlob } from '../../lib/utils'

type FormatOption = 'hyphens' | 'no-hyphens' | 'uppercase'

function generateUUID(format: FormatOption): string {
  const raw = crypto.randomUUID()
  if (format === 'no-hyphens') return raw.replace(/-/g, '')
  if (format === 'uppercase') return raw.toUpperCase()
  return raw
}

const FORMAT_OPTIONS: { value: FormatOption; label: string }[] = [
  { value: 'hyphens', label: 'Com hífens' },
  { value: 'no-hyphens', label: 'Sem hífens' },
  { value: 'uppercase', label: 'Maiúsculas' },
]

export function UuidGenerator() {
  const [format, setFormat] = useState<FormatOption>('hyphens')
  const [single, setSingle] = useState<string>('')
  const [batch, setBatch] = useState<string[]>([])
  const [batchCount, setBatchCount] = useState(10)
  const [sessionCount, setSessionCount] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toasts, toast, dismiss } = useToast()

  const flashCopied = useCallback((id: string) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 1500)
  }, [])

  const handleGenerate = useCallback(() => {
    const uuid = generateUUID(format)
    setSingle(uuid)
    setBatch([])
    setSessionCount(c => c + 1)
  }, [format])

  const handleGenerateBatch = useCallback(() => {
    const count = Math.min(Math.max(1, batchCount), 100)
    const uuids = Array.from({ length: count }, () => generateUUID(format))
    setBatch(uuids)
    setSingle('')
    setSessionCount(c => c + count)
  }, [format, batchCount])

  const handleCopySingle = useCallback(() => {
    if (!single) return
    navigator.clipboard.writeText(single).then(() => {
      toast({ type: 'success', message: 'Copiado!' })
      flashCopied(single)
    })
  }, [single, toast, flashCopied])

  const handleCopyOne = useCallback((uuid: string) => {
    navigator.clipboard.writeText(uuid).then(() => {
      toast({ type: 'success', message: 'Copiado!' })
      flashCopied(uuid)
    })
  }, [toast, flashCopied])

  const handleCopyAll = useCallback(() => {
    if (batch.length === 0) return
    navigator.clipboard.writeText(batch.join('\n')).then(() => {
      toast({ type: 'success', message: `${batch.length} UUIDs copiados!` })
    })
  }, [batch, toast])

  const handleDownload = useCallback(() => {
    if (batch.length === 0) return
    const content = batch.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    downloadBlob(blob, 'uuids.txt')
    toast({ type: 'success', message: 'Arquivo baixado!' })
  }, [batch, toast])

  const handleFormatChange = useCallback((f: FormatOption) => {
    setFormat(f)
    setSingle('')
    setBatch([])
  }, [])

  return (
    <>
      <Helmet>
        <title>Gerador de UUID — UUID v4 criptograficamente seguro | CaosHub</title>
        <meta
          name="description"
          content="Gere UUIDs v4 criptograficamente seguros no navegador. Modo individual ou lote, com e sem hífens, maiúsculas. Download em .txt."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/uuid-generator" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/uuid-generator" />
        <meta property="og:title" content="Gerador de UUID — UUID v4 criptograficamente seguro | CaosHub" />
        <meta property="og:description" content="Gere UUIDs v4 criptograficamente seguros no navegador em modo individual ou lote." />
        <meta name="twitter:title" content="Gerador de UUID — CaosHub" />
        <meta name="twitter:description" content="Gere UUIDs v4 criptograficamente seguros no navegador." />
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
            <Shuffle className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Gerador de UUID</h1>
            <p className="text-text-secondary text-sm mt-1">
              UUID v4 gerado com <code className="font-mono text-xs bg-bg-primary px-1.5 py-0.5 rounded border border-border">crypto.randomUUID()</code> — seguro e local.
            </p>
          </div>
        </div>

        {/* Format options */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Formato
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFormatChange(opt.value)}
                  className={cn(
                    'flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-medium border transition-colors duration-150',
                    format === opt.value
                      ? 'bg-accent border-accent text-white'
                      : 'bg-bg-primary border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Single generate */}
          <Button
            variant="primary"
            className="w-full gap-2 py-3 text-base"
            onClick={handleGenerate}
          >
            <Shuffle className="w-5 h-5" />
            Gerar UUID
          </Button>

          <AnimatePresence>
            {single && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  onClick={handleCopySingle}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors duration-150',
                    copiedId === single
                      ? 'bg-success/5 border-success/30'
                      : 'bg-bg-primary border-border hover:border-accent/50',
                  )}
                  title="Clique para copiar"
                >
                  <span className="font-mono text-sm text-text-primary break-all text-left">
                    {single}
                  </span>
                  {copiedId === single ? (
                    <CheckCheck className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-secondary shrink-0" />
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Batch mode */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Modo lote
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={100}
              value={batchCount}
              onChange={e => setBatchCount(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="w-24 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary text-center font-mono focus:outline-none focus:border-accent/50 transition-colors duration-150"
            />
            <span className="text-sm text-text-secondary">UUIDs (máx. 100)</span>
            <Button variant="ghost" onClick={handleGenerateBatch} className="ml-auto">
              Gerar Lote
            </Button>
          </div>

          <AnimatePresence>
            {batch.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Batch actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={handleCopyAll} className="gap-2 text-xs h-8 px-3">
                    <Copy className="w-3.5 h-3.5" />
                    Copiar todos ({batch.length})
                  </Button>
                  <Button variant="ghost" onClick={handleDownload} className="gap-2 text-xs h-8 px-3">
                    <Download className="w-3.5 h-3.5" />
                    Baixar .txt
                  </Button>
                </div>

                {/* UUID list */}
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {batch.map((uuid, i) => (
                    <button
                      key={`${uuid}-${i}`}
                      onClick={() => handleCopyOne(uuid)}
                      className={cn(
                        'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-left transition-colors duration-150',
                        copiedId === uuid
                          ? 'bg-success/5 border-success/30'
                          : 'bg-bg-primary border-border hover:border-accent/50',
                      )}
                      title="Clique para copiar"
                    >
                      <span className="font-mono text-xs text-text-primary">{uuid}</span>
                      {copiedId === uuid ? (
                        <CheckCheck className="w-3.5 h-3.5 text-success shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-text-secondary/50 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Session counter */}
        {sessionCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-text-secondary"
          >
            {sessionCount} UUID{sessionCount !== 1 ? 's' : ''} gerado{sessionCount !== 1 ? 's' : ''} nesta sessão
          </motion.p>
        )}
      </motion.div>
    </>
  )
}
