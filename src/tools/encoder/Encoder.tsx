import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Binary, Copy, Download, Trash2, AlertTriangle } from 'lucide-react'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, downloadBlob, formatBytes } from '../../lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type MainTab = 'base64' | 'url' | 'html'
type Base64SubTab = 'text' | 'file'

// ─── HTML entities ────────────────────────────────────────────────────────────

const HTML_ENCODE_MAP: [RegExp, string][] = [
  [/&/g, '&amp;'],
  [/</g, '&lt;'],
  [/>/g, '&gt;'],
  [/"/g, '&quot;'],
  [/'/g, '&#039;'],
]

const HTML_DECODE_MAP: [RegExp, string][] = [
  [/&amp;/g, '&'],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#039;/g, "'"],
  [/&#39;/g, "'"],
]

function htmlEncode(str: string): string {
  return HTML_ENCODE_MAP.reduce((s, [re, rep]) => s.replace(re, rep), str)
}

function htmlDecode(str: string): string {
  return HTML_DECODE_MAP.reduce((s, [re, rep]) => s.replace(re, rep), str)
}

// ─── IO panel ────────────────────────────────────────────────────────────────

interface IoPanelProps {
  label: string
  value: string
  readOnly?: boolean
  placeholder?: string
  onChange?: (v: string) => void
  onCopy?: () => void
  minHeight?: string
  footer?: React.ReactNode
  error?: string | null
}

function IoPanel({
  label,
  value,
  readOnly = false,
  placeholder,
  onChange,
  onCopy,
  minHeight = 'min-h-[140px]',
  footer,
  error,
}: IoPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {value && (
            <span className="text-xs text-text-secondary tabular-nums">{value.length} chars</span>
          )}
          {onCopy && value && (
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors duration-150"
            >
              <Copy className="w-3 h-3" />
              Copiar
            </button>
          )}
        </div>
      </div>
      <textarea
        readOnly={readOnly}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        spellCheck={false}
        placeholder={placeholder}
        className={cn(
          'w-full resize-y bg-bg-primary border rounded-lg p-3 text-sm font-mono text-text-primary placeholder:text-text-secondary/40 focus:outline-none transition-colors duration-150',
          minHeight,
          error ? 'border-error/50 focus:border-error' : 'border-border focus:border-accent/50',
          readOnly && 'cursor-default',
        )}
      />
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-1.5 text-xs text-error overflow-hidden"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      {footer}
    </div>
  )
}

// ─── Base64 text sub-tab ──────────────────────────────────────────────────────

function Base64TextPanel() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { toasts, toast, dismiss } = useToast()

  const handleEncode = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)))
      setOutput(encoded)
      setError(null)
    } catch {
      setError('Não foi possível codificar o texto.')
    }
  }

  const handleDecode = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(input.trim())))
      setOutput(decoded)
      setError(null)
    } catch {
      setError('Texto Base64 inválido — verifique a entrada.')
    }
  }

  const copy = (val: string) => {
    navigator.clipboard.writeText(val).then(() => toast({ type: 'success', message: 'Copiado!' }))
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError(null)
  }

  const inputBytes = new TextEncoder().encode(input).length
  const outputBytes = new TextEncoder().encode(output).length

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <IoPanel
        label="Entrada"
        value={input}
        onChange={setInput}
        placeholder="Digite texto ou Base64..."
        error={error}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={handleEncode} disabled={!input.trim()}>
          Codificar
        </Button>
        <Button variant="ghost" onClick={handleDecode} disabled={!input.trim()}>
          Decodificar
        </Button>
        <Button variant="danger" onClick={clear} disabled={!input && !output}>
          <Trash2 className="w-4 h-4" />
          Limpar
        </Button>
      </div>

      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            <IoPanel
              label="Resultado"
              value={output}
              readOnly
              onCopy={() => copy(output)}
            />
            {inputBytes > 0 && outputBytes > 0 && (
              <p className="text-xs text-text-secondary">
                {formatBytes(inputBytes)} → {formatBytes(outputBytes)}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Base64 file sub-tab ──────────────────────────────────────────────────────

function Base64FilePanel() {
  const [output, setOutput] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const { toasts, toast, dismiss } = useToast()

  const handleFile = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    setFileName(file.name)
    setOriginalSize(file.size)
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      // strip the data URL prefix: "data:...;base64,"
      const b64 = dataUrl.split(',')[1] ?? ''
      setOutput(b64)
    }
    reader.onerror = () => toast({ type: 'error', message: 'Erro ao ler o arquivo.' })
    reader.readAsDataURL(file)
  }, [toast])

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => toast({ type: 'success', message: 'Copiado!' }))
  }

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    downloadBlob(blob, `${fileName ?? 'arquivo'}.base64.txt`)
    toast({ type: 'success', message: 'Arquivo baixado!' })
  }

  const outputSize = new TextEncoder().encode(output).length

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <FileUploadZone
        onFiles={handleFile}
        label="Arraste um arquivo ou clique para selecionar"
        hint="Qualquer tipo de arquivo — convertido para Base64 localmente"
      />

      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Base64
                </label>
                <span className="text-xs text-text-secondary">
                  {formatBytes(originalSize)} → {formatBytes(outputSize)}
                </span>
              </div>
              <textarea
                readOnly
                value={output}
                className="w-full min-h-[120px] resize-y bg-bg-primary border border-border rounded-lg p-3 text-xs font-mono text-text-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={copy} className="gap-2">
                <Copy className="w-4 h-4" />
                Copiar
              </Button>
              <Button variant="ghost" onClick={download} className="gap-2">
                <Download className="w-4 h-4" />
                Baixar .txt
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── URL tab ──────────────────────────────────────────────────────────────────

function UrlPanel() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { toasts, toast, dismiss } = useToast()

  const copy = (val: string) =>
    navigator.clipboard.writeText(val).then(() => toast({ type: 'success', message: 'Copiado!' }))

  const handleEncode = () => {
    try {
      setOutput(encodeURIComponent(input))
      setError(null)
    } catch {
      setError('Não foi possível codificar.')
    }
  }

  const handleDecode = () => {
    try {
      setOutput(decodeURIComponent(input))
      setError(null)
    } catch {
      setError('URI inválido — verifique a entrada.')
    }
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError(null)
  }

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <IoPanel
        label="Entrada"
        value={input}
        onChange={setInput}
        placeholder="Digite uma URL ou texto codificado..."
        error={error}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={handleEncode} disabled={!input.trim()}>
          Codificar (encodeURIComponent)
        </Button>
        <Button variant="ghost" onClick={handleDecode} disabled={!input.trim()}>
          Decodificar (decodeURIComponent)
        </Button>
        <Button variant="danger" onClick={clear} disabled={!input && !output}>
          <Trash2 className="w-4 h-4" />
          Limpar
        </Button>
      </div>

      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <IoPanel
              label="Resultado"
              value={output}
              readOnly
              onCopy={() => copy(output)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── HTML tab ─────────────────────────────────────────────────────────────────

function HtmlPanel() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const { toasts, toast, dismiss } = useToast()

  const copy = (val: string) =>
    navigator.clipboard.writeText(val).then(() => toast({ type: 'success', message: 'Copiado!' }))

  const handleEncode = () => setOutput(htmlEncode(input))
  const handleDecode = () => setOutput(htmlDecode(input))
  const clear = () => {
    setInput('')
    setOutput('')
  }

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <IoPanel
        label="Entrada"
        value={input}
        onChange={setInput}
        placeholder="Digite HTML ou texto com entidades..."
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={handleEncode} disabled={!input.trim()}>
          Codificar
        </Button>
        <Button variant="ghost" onClick={handleDecode} disabled={!input.trim()}>
          Decodificar
        </Button>
        <Button variant="danger" onClick={clear} disabled={!input && !output}>
          <Trash2 className="w-4 h-4" />
          Limpar
        </Button>
      </div>

      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <IoPanel
              label="Resultado"
              value={output}
              readOnly
              onCopy={() => copy(output)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

const MAIN_TABS: { value: MainTab; label: string }[] = [
  { value: 'base64', label: 'Base64' },
  { value: 'url', label: 'URL' },
  { value: 'html', label: 'HTML' },
]

const BASE64_SUB_TABS: { value: Base64SubTab; label: string }[] = [
  { value: 'text', label: 'Texto \u2194 Base64' },
  { value: 'file', label: 'Arquivo \u2192 Base64' },
]

export function Encoder() {
  const [mainTab, setMainTab] = useState<MainTab>('base64')
  const [b64SubTab, setB64SubTab] = useState<Base64SubTab>('text')

  return (
    <>
      <Helmet>
        <title>Codificador — Base64, URL e HTML Encoder/Decoder | CaosHub</title>
        <meta
          name="description"
          content="Codifique e decodifique Base64, URL (encodeURIComponent) e HTML entities diretamente no navegador. Suporte a arquivos para Base64."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/encoder" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/encoder" />
        <meta property="og:title" content="Codificador — Base64, URL e HTML Encoder/Decoder | CaosHub" />
        <meta property="og:description" content="Codifique e decodifique Base64, URL e HTML entities no navegador." />
        <meta name="twitter:title" content="Codificador — CaosHub" />
        <meta name="twitter:description" content="Codifique e decodifique Base64, URL e HTML entities no navegador." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 py-8 pb-12 space-y-6"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
            <Binary className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Codificador</h1>
            <p className="text-text-secondary text-sm mt-1">
              Codifique e decodifique Base64, URL e HTML entities no navegador.
            </p>
          </div>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2">
          {MAIN_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setMainTab(t.value)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
                mainTab === t.value
                  ? 'bg-accent border-accent text-white'
                  : 'bg-surface border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mainTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-surface border border-border rounded-xl p-4 space-y-4"
          >
            {mainTab === 'base64' && (
              <>
                {/* Base64 sub-tabs */}
                <div className="flex gap-2">
                  {BASE64_SUB_TABS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setB64SubTab(t.value)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150',
                        b64SubTab === t.value
                          ? 'bg-accent/10 border-accent/40 text-accent'
                          : 'bg-bg-primary border-border text-text-secondary hover:border-accent/30 hover:text-text-primary',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={b64SubTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    {b64SubTab === 'text' ? <Base64TextPanel /> : <Base64FilePanel />}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {mainTab === 'url' && <UrlPanel />}
            {mainTab === 'html' && <HtmlPanel />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </>
  )
}
