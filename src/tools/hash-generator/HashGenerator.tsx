import { useState, useCallback, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Copy, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import SparkMD5 from 'spark-md5'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

type Tab = 'text' | 'file'

interface HashSet {
  md5: string
  sha1: string
  sha256: string
  sha384: string
  sha512: string
}

const EMPTY_HASHES: HashSet = { md5: '', sha1: '', sha256: '', sha384: '', sha512: '' }

const ALGO_LABELS: { key: keyof HashSet; label: string; subtle: string }[] = [
  { key: 'md5', label: 'MD5', subtle: '' },
  { key: 'sha1', label: 'SHA-1', subtle: 'SHA-1' },
  { key: 'sha256', label: 'SHA-256', subtle: 'SHA-256' },
  { key: 'sha384', label: 'SHA-384', subtle: 'SHA-384' },
  { key: 'sha512', label: 'SHA-512', subtle: 'SHA-512' },
]

async function subtleHash(data: ArrayBuffer, algo: string): Promise<string> {
  const buf = await crypto.subtle.digest(algo, data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hashBuffer(buf: ArrayBuffer): Promise<HashSet> {
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    subtleHash(buf, 'SHA-1'),
    subtleHash(buf, 'SHA-256'),
    subtleHash(buf, 'SHA-384'),
    subtleHash(buf, 'SHA-512'),
  ])
  const spark = new SparkMD5.ArrayBuffer()
  spark.append(buf)
  const md5 = spark.end()
  return { md5, sha1, sha256, sha384, sha512 }
}

async function hashText(text: string): Promise<HashSet> {
  const buf = new TextEncoder().encode(text).buffer as ArrayBuffer
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    subtleHash(buf, 'SHA-1'),
    subtleHash(buf, 'SHA-256'),
    subtleHash(buf, 'SHA-384'),
    subtleHash(buf, 'SHA-512'),
  ])
  const md5 = SparkMD5.hash(text)
  return { md5, sha1, sha256, sha384, sha512 }
}

export function HashGenerator() {
  const [tab, setTab] = useState<Tab>('text')
  const [textInput, setTextInput] = useState('')
  const [hashes, setHashes] = useState<HashSet>(EMPTY_HASHES)
  const [uppercase, setUppercase] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const { toasts, toast, dismiss } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copyHash = useCallback((value: string) => {
    const val = uppercase ? value.toUpperCase() : value
    if (!val) return
    navigator.clipboard.writeText(val).then(() => {
      toast({ type: 'success', message: 'Copiado!' })
    })
  }, [uppercase, toast])

  // Debounced text hashing
  useEffect(() => {
    if (tab !== 'text') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!textInput) {
      setHashes(EMPTY_HASHES)
      return
    }
    debounceRef.current = setTimeout(() => {
      hashText(textInput).then(setHashes).catch(() => setHashes(EMPTY_HASHES))
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [textInput, tab])

  const handleFile = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    setFileName(file.name)
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer
        const result = await hashBuffer(buf)
        setHashes(result)
      } catch {
        toast({ type: 'error', message: 'Erro ao calcular hashes do arquivo.' })
        setHashes(EMPTY_HASHES)
      } finally {
        setLoading(false)
      }
    }
    reader.onerror = () => {
      toast({ type: 'error', message: 'Erro ao ler o arquivo.' })
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }, [toast])

  const handleTabChange = (t: Tab) => {
    setTab(t)
    setHashes(EMPTY_HASHES)
    setFileName(null)
    setTextInput('')
  }

  const hasHashes = Object.values(hashes).some(v => v !== '')

  return (
    <>
      <Helmet>
        <title>Gerador de Hash — MD5, SHA-256, SHA-512 online | CaosHub</title>
        <meta
          name="description"
          content="Gere hashes MD5, SHA-1, SHA-256, SHA-384 e SHA-512 de textos ou arquivos diretamente no navegador. Sem upload para servidores."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/hash-generator" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/hash-generator" />
        <meta property="og:title" content="Gerador de Hash — MD5, SHA-256, SHA-512 online | CaosHub" />
        <meta property="og:description" content="Gere hashes MD5, SHA-1, SHA-256, SHA-384 e SHA-512 de textos ou arquivos no navegador." />
        <meta name="twitter:title" content="Gerador de Hash — CaosHub" />
        <meta name="twitter:description" content="Gere hashes MD5, SHA-1, SHA-256, SHA-384 e SHA-512 de textos ou arquivos no navegador." />
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
            <Hash className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Gerador de Hash</h1>
            <p className="text-text-secondary text-sm mt-1">
              Calcule hashes MD5, SHA-1, SHA-256, SHA-384 e SHA-512 de textos e arquivos.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <div className="flex gap-2">
            {(['text', 'file'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150',
                  tab === t
                    ? 'bg-accent border-accent text-white'
                    : 'bg-bg-primary border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
                )}
              >
                {t === 'text' ? 'Texto' : 'Arquivo'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'text' ? (
              <motion.div
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  spellCheck={false}
                  placeholder="Digite ou cole o texto aqui..."
                  className="w-full min-h-[120px] resize-y bg-bg-primary border border-border rounded-lg p-3 text-sm font-mono text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors duration-150"
                />
              </motion.div>
            ) : (
              <motion.div
                key="file"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <FileUploadZone
                  onFiles={handleFile}
                  label="Arraste um arquivo aqui ou clique para selecionar"
                  hint="Qualquer tipo de arquivo — processado localmente"
                />
                <AnimatePresence>
                  {fileName && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-text-secondary overflow-hidden"
                    >
                      Arquivo: <span className="text-text-primary font-medium">{fileName}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        <AnimatePresence>
          {(hasHashes || loading) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Hashes
                </span>
                <button
                  onClick={() => setUppercase(u => !u)}
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors duration-150"
                  title="Alternar maiúsculas/minúsculas"
                >
                  {uppercase ? (
                    <ToggleRight className="w-4 h-4 text-accent" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  {uppercase ? 'MAIÚSCULAS' : 'minúsculas'}
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-text-secondary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Calculando hashes...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {ALGO_LABELS.map(({ key, label }) => {
                    const value = hashes[key]
                    const display = uppercase ? value.toUpperCase() : value
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            {label}
                          </span>
                          <button
                            onClick={() => copyHash(value)}
                            disabled={!value}
                            className={cn(
                              'inline-flex items-center gap-1 text-xs transition-colors duration-150',
                              value
                                ? 'text-text-secondary hover:text-accent cursor-pointer'
                                : 'text-text-secondary/30 cursor-not-allowed',
                            )}
                          >
                            <Copy className="w-3 h-3" />
                            Copiar
                          </button>
                        </div>
                        <div className="bg-bg-primary border border-border rounded-lg px-3 py-2 overflow-hidden">
                          <p className="text-xs font-mono text-text-primary break-all">
                            {display || <span className="text-text-secondary/40">—</span>}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
