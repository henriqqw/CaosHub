import { useState, useCallback, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Braces, Copy, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

type FormatMode = 'format2' | 'format4' | 'minify' | null

interface ParseResult {
  valid: boolean
  error: string | null
  errorPosition: string | null
}

function parseJson(raw: string): ParseResult {
  if (!raw.trim()) return { valid: false, error: null, errorPosition: null }
  try {
    JSON.parse(raw)
    return { valid: true, error: null, errorPosition: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'JSON inválido'
    const posMatch = msg.match(/position (\d+)/)
    const lineMatch = msg.match(/line (\d+) column (\d+)/)
    let position: string | null = null
    if (lineMatch) {
      position = `linha ${lineMatch[1]}, coluna ${lineMatch[2]}`
    } else if (posMatch) {
      position = `posição ${posMatch[1]}`
    }
    return { valid: false, error: msg, errorPosition: position }
  }
}

export function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult>({ valid: false, error: null, errorPosition: null })
  const [lastMode, setLastMode] = useState<FormatMode>(null)
  const { toasts, toast, dismiss } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setParseResult(parseJson(input))
  }, [input])

  const handleFormat = useCallback((indent: number) => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, indent)
      setOutput(formatted)
      setLastMode(indent === 2 ? 'format2' : 'format4')
    } catch {
      toast({ type: 'error', message: 'JSON inválido — corrija os erros antes de formatar.' })
    }
  }, [input, toast])

  const handleMinify = useCallback(() => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setLastMode('minify')
    } catch {
      toast({ type: 'error', message: 'JSON inválido — corrija os erros antes de minificar.' })
    }
  }, [input, toast])

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      toast({ type: 'warning', message: 'Digite algum JSON para validar.' })
      return
    }
    const result = parseJson(input)
    if (result.valid) {
      toast({ type: 'success', message: 'JSON válido!' })
    } else {
      toast({ type: 'error', message: result.errorPosition ? `JSON inválido em ${result.errorPosition}` : 'JSON inválido.' })
    }
  }, [input, toast])

  const handleCopy = useCallback(() => {
    if (!output) return
    navigator.clipboard.writeText(output).then(() => {
      toast({ type: 'success', message: 'Copiado!' })
    })
  }, [output, toast])

  const handleClear = useCallback(() => {
    setInput('')
    setOutput('')
    setLastMode(null)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleFormat(2)
    }
  }, [handleFormat])

  const showBadge = input.trim().length > 0

  return (
    <>
      <Helmet>
        <title>JSON Formatter — Formatar, Minificar e Validar JSON | CaosHub</title>
        <meta
          name="description"
          content="Formate, minifique e valide JSON diretamente no navegador. Sem servidor, sem upload. Ferramenta gratuita e rápida."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/json-formatter" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/json-formatter" />
        <meta property="og:title" content="JSON Formatter — Formatar, Minificar e Validar JSON | CaosHub" />
        <meta property="og:description" content="Formate, minifique e valide JSON diretamente no navegador." />
        <meta name="twitter:title" content="JSON Formatter — CaosHub" />
        <meta name="twitter:description" content="Formate, minifique e valide JSON diretamente no navegador." />
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
            <Braces className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">JSON Formatter</h1>
            <p className="text-text-secondary text-sm mt-1">
              Formate, minifique e valide JSON diretamente no navegador.
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              JSON de entrada
            </label>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {showBadge && (
                  <motion.span
                    key={parseResult.valid ? 'valid' : 'invalid'}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                      parseResult.valid
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-error/10 text-error border border-error/20',
                    )}
                  >
                    {parseResult.valid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        JSON válido
                      </>
                    ) : (
                      <>JSON inválido</>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="text-xs text-text-secondary tabular-nums">
                {input.length} chars
              </span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder={'{\n  "exemplo": "cole seu JSON aqui"\n}'}
            className="w-full min-h-[300px] resize-y bg-bg-primary border border-border rounded-lg p-3 text-sm font-mono text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors duration-150"
          />

          <AnimatePresence>
            {showBadge && !parseResult.valid && parseResult.error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-error font-mono overflow-hidden"
              >
                {parseResult.errorPosition
                  ? `Erro em ${parseResult.errorPosition}: ${parseResult.error}`
                  : parseResult.error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => handleFormat(2)}
              disabled={!input.trim()}
            >
              Formatar (2 esp.)
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleFormat(4)}
              disabled={!input.trim()}
            >
              Formatar (4 esp.)
            </Button>
            <Button
              variant="ghost"
              onClick={handleMinify}
              disabled={!input.trim()}
            >
              Minificar
            </Button>
            <Button
              variant="ghost"
              onClick={handleValidate}
              disabled={!input.trim()}
            >
              Validar
            </Button>
            <Button
              variant="danger"
              onClick={handleClear}
              disabled={!input && !output}
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          </div>

          <p className="text-xs text-text-secondary">
            Atalho: <kbd className="px-1.5 py-0.5 rounded bg-bg-primary border border-border font-mono text-xs">Ctrl+Enter</kbd> para formatar com 2 espaços
          </p>
        </div>

        {/* Output area */}
        <AnimatePresence>
          {output && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Resultado
                  </label>
                  {lastMode && (
                    <span className="text-xs text-text-secondary">
                      — {lastMode === 'minify' ? 'minificado' : lastMode === 'format2' ? '2 espaços' : '4 espaços'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-secondary tabular-nums">
                  {output.length} chars
                </span>
              </div>

              <textarea
                readOnly
                value={output}
                spellCheck={false}
                className="w-full min-h-[200px] resize-y bg-bg-primary border border-border rounded-lg p-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent/50 transition-colors duration-150"
              />

              <Button
                variant="ghost"
                onClick={handleCopy}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar resultado
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
