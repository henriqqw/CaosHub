import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Trash2, Copy } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { analyzeText, type TextStats } from './utils/analyzeText'

interface StatCardProps {
  label: string
  value: string | number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-text-secondary leading-tight">{label}</span>
      <span className="text-2xl font-bold text-text-primary leading-tight">{value}</span>
    </div>
  )
}

const EMPTY_STATS: TextStats = {
  characters: 0,
  charactersNoSpaces: 0,
  words: 0,
  uniqueWords: 0,
  sentences: 0,
  paragraphs: 0,
  lines: 0,
  readingTime: '0 seg',
  longestWord: '—',
  avgWordLength: 0,
}

export function CharacterCounter() {
  const [text, setText] = useState('')
  const { toasts, toast, dismiss } = useToast()

  const stats = text.length > 0 ? analyzeText(text) : EMPTY_STATS

  async function handleCopy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast({ type: 'success', message: 'Texto copiado!' })
    } catch {
      toast({ type: 'error', message: 'Não foi possível copiar.' })
    }
  }

  function handleClear() {
    setText('')
  }

  return (
    <>
      <Helmet>
        <title>Contador de Caracteres — Palavras, frases e mais | CaosHub</title>
        <meta name="description" content="Conte caracteres, palavras, frases e parágrafos em tempo real. Calcule o tempo de leitura do seu texto online, sem upload." />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/character-counter" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/character-counter" />
        <meta property="og:title" content="Contador de Caracteres — CaosHub" />
        <meta property="og:description" content="Conte caracteres, palavras, frases e mais em tempo real, diretamente no navegador." />
        <meta name="twitter:title" content="Contador de Caracteres — CaosHub" />
        <meta name="twitter:description" content="Conte caracteres, palavras, frases e mais em tempo real, diretamente no navegador." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 pb-12 space-y-6"
      >
        {/* Header */}
        <div className="space-y-1 pt-8">
          <h1 className="text-2xl font-bold text-text-primary">Contador de Caracteres</h1>
          <p className="text-sm text-text-secondary">
            Cole ou digite seu texto e veja as estatísticas em tempo real.
          </p>
        </div>

        {/* Textarea + actions */}
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Cole ou escreva seu texto aqui..."
            rows={8}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 resize-y outline-none focus:border-accent/60 transition-colors duration-150 min-h-48"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={handleCopy} disabled={!text} className="gap-2">
              <Copy className="w-4 h-4" />
              Copiar texto
            </Button>
            <Button variant="danger" onClick={handleClear} disabled={!text} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Caracteres (com espaços)" value={stats.characters} />
          <StatCard label="Caracteres (sem espaços)" value={stats.charactersNoSpaces} />
          <StatCard label="Palavras" value={stats.words} />
          <StatCard label="Palavras únicas" value={stats.uniqueWords} />
          <StatCard label="Frases" value={stats.sentences} />
          <StatCard label="Parágrafos" value={stats.paragraphs} />
          <StatCard label="Linhas" value={stats.lines} />
          <StatCard label="Tempo de leitura" value={stats.readingTime} />
          <StatCard
            label="Palavra mais longa"
            value={stats.longestWord || '—'}
          />
          <StatCard
            label="Comprimento médio (palavras)"
            value={stats.avgWordLength === 0 ? '—' : stats.avgWordLength}
          />
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
