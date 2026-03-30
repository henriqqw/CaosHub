import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { KeySquare, Copy, Trash2, AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

interface JwtParts {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

interface DecodeResult {
  parts: JwtParts | null
  error: string | null
}

function decodeJWT(token: string): DecodeResult {
  const trimmed = token.trim()
  if (!trimmed) return { parts: null, error: null }
  const parts = trimmed.split('.')
  if (parts.length !== 3) return { parts: null, error: 'Token JWT inválido — deve ter 3 partes separadas por "."' }
  try {
    const decode = (str: string): Record<string, unknown> => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      return JSON.parse(atob(padded)) as Record<string, unknown>
    }
    return {
      parts: {
        header: decode(parts[0]),
        payload: decode(parts[1]),
        signature: parts[2],
      },
      error: null,
    }
  } catch {
    return { parts: null, error: 'Não foi possível decodificar o token — verifique se é um JWT válido.' }
  }
}

function formatDate(ts: unknown): string | null {
  if (typeof ts !== 'number') return null
  return new Date(ts * 1000).toLocaleString('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getExpStatus(exp: unknown): { label: string; type: 'success' | 'error' | 'warning' } | null {
  if (typeof exp !== 'number') return null
  const now = Math.floor(Date.now() / 1000)
  const diff = exp - now
  if (diff <= 0) {
    const ago = Math.abs(diff)
    if (ago < 60) return { label: `Expirado há ${ago}s`, type: 'error' }
    if (ago < 3600) return { label: `Expirado há ${Math.floor(ago / 60)}min`, type: 'error' }
    if (ago < 86400) return { label: `Expirado há ${Math.floor(ago / 3600)}h`, type: 'error' }
    return { label: `Expirado há ${Math.floor(ago / 86400)} dias`, type: 'error' }
  }
  if (diff < 300) return { label: `Expira em ${diff}s`, type: 'warning' }
  if (diff < 3600) return { label: `Expira em ${Math.floor(diff / 60)}min`, type: 'warning' }
  if (diff < 86400) return { label: `Expira em ${Math.floor(diff / 3600)}h`, type: 'success' }
  return { label: `Expira em ${Math.floor(diff / 86400)} dias`, type: 'success' }
}

interface SectionProps {
  title: string
  colorClass: string
  borderClass: string
  bgClass: string
  content: string
  onCopy: () => void
}

function Section({ title, colorClass, borderClass, bgClass, content, onCopy }: SectionProps) {
  return (
    <div className={cn('rounded-xl border p-4 space-y-3', borderClass, bgClass)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-bold uppercase tracking-widest', colorClass)}>
          {title}
        </span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          <Copy className="w-3 h-3" />
          Copiar
        </button>
      </div>
      <pre className="text-xs font-mono text-text-primary whitespace-pre-wrap break-all leading-relaxed">
        {content}
      </pre>
    </div>
  )
}

export function JwtDecoder() {
  const [input, setInput] = useState('')
  const { toasts, toast, dismiss } = useToast()

  const { parts, error } = decodeJWT(input)

  const copySection = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({ type: 'success', message: 'Copiado!' })
    })
  }, [toast])

  const handleClear = useCallback(() => {
    setInput('')
  }, [])

  const payload = parts?.payload
  const expStatus = payload ? getExpStatus(payload.exp) : null
  const iat = typeof payload?.iat === 'number' ? payload.iat : undefined
  const sub = typeof payload?.sub === 'string' ? payload.sub : null
  const iss = typeof payload?.iss === 'string' ? payload.iss : null

  return (
    <>
      <Helmet>
        <title>JWT Decoder — Decodificar Token JWT online | CaosHub</title>
        <meta
          name="description"
          content="Decodifique tokens JWT e visualize header, payload e assinatura diretamente no navegador. Verifique expiração e claims sem enviar dados ao servidor."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/jwt-decoder" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/jwt-decoder" />
        <meta property="og:title" content="JWT Decoder — Decodificar Token JWT online | CaosHub" />
        <meta property="og:description" content="Decodifique tokens JWT e visualize header, payload e assinatura no navegador." />
        <meta name="twitter:title" content="JWT Decoder — CaosHub" />
        <meta name="twitter:description" content="Decodifique tokens JWT e visualize header, payload e assinatura no navegador." />
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
            <KeySquare className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">JWT Decoder</h1>
            <p className="text-text-secondary text-sm mt-1">
              Decodifique tokens JWT e visualize header, payload e assinatura.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Token JWT
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Cole seu token JWT aqui: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full min-h-[120px] resize-y bg-bg-primary border border-border rounded-lg p-3 text-sm font-mono text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors duration-150"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Info className="w-3.5 h-3.5 shrink-0" />
              A assinatura não é verificada — apenas decodificação
            </div>
            <Button variant="danger" onClick={handleClear} disabled={!input}>
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-2 text-sm text-error overflow-hidden"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Decoded sections */}
        <AnimatePresence>
          {parts && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Expiry status */}
              <div className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium',
                expStatus?.type === 'error'
                  ? 'bg-error/5 border-error/20 text-error'
                  : expStatus?.type === 'warning'
                  ? 'bg-warning/5 border-warning/20 text-warning'
                  : expStatus?.type === 'success'
                  ? 'bg-success/5 border-success/20 text-success'
                  : 'bg-surface border-border text-text-secondary',
              )}>
                {expStatus?.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : expStatus?.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 shrink-0" />
                )}
                {expStatus?.label ?? 'Sem expiração definida'}
              </div>

              {/* Claims summary */}
              {(iat || sub || iss) && (
                <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Claims principais
                  </span>
                  <dl className="space-y-1.5 mt-2">
                    {iat && (
                      <div className="flex flex-wrap gap-x-3 text-sm">
                        <dt className="text-text-secondary font-medium w-20 shrink-0">iat</dt>
                        <dd className="text-text-primary font-mono">{formatDate(iat)}</dd>
                      </div>
                    )}
                    {sub && (
                      <div className="flex flex-wrap gap-x-3 text-sm">
                        <dt className="text-text-secondary font-medium w-20 shrink-0">sub</dt>
                        <dd className="text-text-primary font-mono break-all">{String(sub)}</dd>
                      </div>
                    )}
                    {iss && (
                      <div className="flex flex-wrap gap-x-3 text-sm">
                        <dt className="text-text-secondary font-medium w-20 shrink-0">iss</dt>
                        <dd className="text-text-primary font-mono break-all">{String(iss)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Header */}
              <Section
                title={`Header${typeof parts.header.alg === 'string' ? ` · ${parts.header.alg}` : ''}`}
                colorClass="text-blue-400"
                borderClass="border-blue-500/20"
                bgClass="bg-blue-500/5"
                content={JSON.stringify(parts.header, null, 2)}
                onCopy={() => copySection(JSON.stringify(parts.header, null, 2))}
              />

              {/* Payload */}
              <Section
                title="Payload"
                colorClass="text-green-400"
                borderClass="border-green-500/20"
                bgClass="bg-green-500/5"
                content={JSON.stringify(parts.payload, null, 2)}
                onCopy={() => copySection(JSON.stringify(parts.payload, null, 2))}
              />

              {/* Signature */}
              <Section
                title="Assinatura (base64url)"
                colorClass="text-accent"
                borderClass="border-accent/20"
                bgClass="bg-accent/5"
                content={parts.signature}
                onCopy={() => copySection(parts.signature)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
