import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Copy, RefreshCw, ClipboardList } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'
import {
  generatePassword,
  generateBatch,
  type PasswordOptions,
  type PasswordResult,
  type StrengthLevel,
} from './utils/generatePassword'

const BATCH_COUNTS = [1, 5, 10, 20] as const

const STRENGTH_CONFIG: Record<
  StrengthLevel,
  { label: string; color: string; bar: string; width: string }
> = {
  weak: {
    label: 'Fraca',
    color: 'text-error',
    bar: 'bg-error',
    width: 'w-1/4',
  },
  fair: {
    label: 'Regular',
    color: 'text-warning',
    bar: 'bg-warning',
    width: 'w-2/4',
  },
  strong: {
    label: 'Forte',
    color: 'text-yellow-300',
    bar: 'bg-yellow-300',
    width: 'w-3/4',
  },
  'very-strong': {
    label: 'Muito forte',
    color: 'text-green-400',
    bar: 'bg-green-400',
    width: 'w-full',
  },
}

const DEFAULT_OPTIONS: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: false,
  excludeAmbiguous: false,
}

interface CheckboxProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function Checkbox({ id, label, checked, onChange, disabled }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-3 cursor-pointer select-none',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <div
        className={cn(
          'w-4 h-4 rounded border flex items-center justify-center transition-colors duration-150 shrink-0',
          checked ? 'bg-accent border-accent' : 'border-border bg-bg-primary',
        )}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-white">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  )
}

export function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS)
  const [result, setResult] = useState<PasswordResult>(() => generatePassword(DEFAULT_OPTIONS))
  const [visible, setVisible] = useState(false)
  const [batchCount, setBatchCount] = useState<(typeof BATCH_COUNTS)[number]>(5)
  const [batch, setBatch] = useState<PasswordResult[]>([])
  const { toasts, toast, dismiss } = useToast()

  const checkedCount = [options.uppercase, options.lowercase, options.numbers, options.symbols].filter(Boolean).length

  const updateOptions = useCallback((patch: Partial<PasswordOptions>) => {
    setOptions(prev => {
      const next = { ...prev, ...patch }
      setResult(generatePassword(next))
      return next
    })
  }, [])

  function regenerate() {
    setResult(generatePassword(options))
    if (batch.length > 0) {
      setBatch(generateBatch(options, batchCount))
    }
  }

  async function copyPassword(pw: string) {
    try {
      await navigator.clipboard.writeText(pw)
      toast({ type: 'success', message: 'Senha copiada!' })
    } catch {
      toast({ type: 'error', message: 'Não foi possível copiar.' })
    }
  }

  function handleGenerateBatch() {
    setBatch(generateBatch(options, batchCount))
  }

  async function copyAll() {
    const all = batch.map(r => r.password).join('\n')
    try {
      await navigator.clipboard.writeText(all)
      toast({ type: 'success', message: `${batch.length} senhas copiadas!` })
    } catch {
      toast({ type: 'error', message: 'Não foi possível copiar.' })
    }
  }

  const strength = STRENGTH_CONFIG[result.strength]

  return (
    <>
      <Helmet>
        <title>Gerador de Senhas — Senhas seguras online | CaosHub</title>
        <meta name="description" content="Gere senhas seguras e aleatórias no navegador. Controle o tamanho, tipo de caracteres e veja a força da senha em tempo real. Sem envio de dados." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/password-generator" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/password-generator" />
        <meta property="og:site_name" content="CaosHub" />
        <meta property="og:title" content="Gerador de Senhas — Senhas seguras online | CaosHub" />
        <meta property="og:description" content="Gere senhas seguras e aleatórias no navegador, sem enviar dados para servidores. Controle tamanho e tipo de caracteres." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://caoshub.vercel.app/tools/password-generator" />
        <meta name="twitter:title" content="Gerador de Senhas — Senhas seguras online | CaosHub" />
        <meta name="twitter:description" content="Gere senhas seguras e aleatórias no navegador, sem enviar dados para servidores. Controle tamanho e tipo de caracteres." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 pb-12 space-y-6"
      >
        {/* Header */}
        <div className="space-y-1 pt-8">
          <h1 className="text-2xl font-bold text-text-primary">Gerador de Senhas</h1>
          <p className="text-sm text-text-secondary">
            Senhas criptograficamente seguras geradas no seu navegador.
          </p>
        </div>

        {/* Password display */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-mono text-xl font-bold text-text-primary break-all leading-tight select-all',
                  !visible && 'tracking-widest',
                )}
              >
                {visible ? result.password : '•'.repeat(result.password.length)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setVisible(v => !v)}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors duration-150"
                title={visible ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => copyPassword(result.password)}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors duration-150"
                title="Copiar senha"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={regenerate}
                className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors duration-150"
                title="Gerar nova senha"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Strength bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Força</span>
              <span className={cn('text-xs font-semibold', strength.color)}>{strength.label}</span>
            </div>
            <div className="w-full h-1.5 bg-bg-primary rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', strength.bar)}
                animate={{ width: strength.width }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ width: strength.width }}
              />
            </div>
            <p className="text-[11px] text-text-secondary">
              {Math.round(result.entropy)} bits de entropia
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-text-primary">Configurações</h2>

          {/* Length slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                Comprimento
              </label>
              <span className="text-sm font-bold text-accent">{options.length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={e => updateOptions({ length: Number(e.target.value) })}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-text-secondary">
              <span>8</span>
              <span>64</span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-3">
            <Checkbox
              id="opt-uppercase"
              label="Maiúsculas (A–Z)"
              checked={options.uppercase}
              onChange={v => {
                if (!v && checkedCount <= 1) return
                updateOptions({ uppercase: v })
              }}
              disabled={options.uppercase && checkedCount <= 1}
            />
            <Checkbox
              id="opt-lowercase"
              label="Minúsculas (a–z)"
              checked={options.lowercase}
              onChange={v => {
                if (!v && checkedCount <= 1) return
                updateOptions({ lowercase: v })
              }}
              disabled={options.lowercase && checkedCount <= 1}
            />
            <Checkbox
              id="opt-numbers"
              label="Números (0–9)"
              checked={options.numbers}
              onChange={v => {
                if (!v && checkedCount <= 1) return
                updateOptions({ numbers: v })
              }}
              disabled={options.numbers && checkedCount <= 1}
            />
            <Checkbox
              id="opt-symbols"
              label="Símbolos (!@#...)"
              checked={options.symbols}
              onChange={v => {
                if (!v && checkedCount <= 1) return
                updateOptions({ symbols: v })
              }}
              disabled={options.symbols && checkedCount <= 1}
            />
          </div>

          <div className="border-t border-border pt-4">
            <Checkbox
              id="opt-ambiguous"
              label="Excluir caracteres ambíguos (0, O, l, 1, I)"
              checked={options.excludeAmbiguous}
              onChange={v => updateOptions({ excludeAmbiguous: v })}
            />
          </div>
        </div>

        {/* Batch generation */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Geração em lote</h2>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-text-secondary">Gerar</span>
            <div className="flex gap-2">
              {BATCH_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setBatchCount(n)}
                  className={cn(
                    'w-10 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-150',
                    batchCount === n
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-bg-primary border-border text-text-secondary hover:border-accent/40',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="text-sm text-text-secondary">senhas</span>
            <Button variant="ghost" onClick={handleGenerateBatch} className="gap-2 ml-auto">
              <ClipboardList className="w-4 h-4" />
              Gerar
            </Button>
          </div>

          <AnimatePresence>
            {batch.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                {batch.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-bg-primary border border-border rounded-lg px-4 py-2.5"
                  >
                    <span className="font-mono text-sm text-text-primary flex-1 truncate">
                      {r.password}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-medium shrink-0',
                        STRENGTH_CONFIG[r.strength].color,
                      )}
                    >
                      {STRENGTH_CONFIG[r.strength].label}
                    </span>
                    <button
                      onClick={() => copyPassword(r.password)}
                      className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface transition-colors duration-150 shrink-0"
                      title="Copiar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <Button variant="ghost" onClick={copyAll} className="w-full gap-2 mt-1">
                  <Copy className="w-4 h-4" />
                  Copiar todas
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
