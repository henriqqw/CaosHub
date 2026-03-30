import { useState, useMemo, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { NotebookPen, Copy, Download, FileText, Eye } from 'lucide-react'
import { marked } from 'marked'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, downloadBlob } from '../../lib/utils'

marked.setOptions({ breaks: true, gfm: true })

const DEFAULT_MARKDOWN = `# Bem-vindo ao Markdown Preview

Este editor mostra uma **prévia em tempo real** enquanto você digita.

## Funcionalidades

- Edição ao vivo com *syntax* support
- Exportar como **.md** ou **.html**
- Barra de ferramentas para formatação rápida

## Exemplo de código

\`\`\`javascript
function hello(name) {
  return \`Olá, \${name}!\`
}
\`\`\`

## Citação

> "A simplicidade é a sofisticação máxima." — Leonardo da Vinci

## Tabela

| Coluna A | Coluna B | Coluna C |
|----------|----------|----------|
| Valor 1  | Valor 2  | Valor 3  |
| Valor 4  | Valor 5  | Valor 6  |

---

Comece a editar no painel esquerdo!
`

const PREVIEW_STYLES = `
  .md-preview h1, .md-preview h2, .md-preview h3, .md-preview h4, .md-preview h5, .md-preview h6 {
    font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; line-height: 1.3; color: #ffffff;
  }
  .md-preview h1 { font-size: 1.75rem; border-bottom: 1px solid #2A2A2A; padding-bottom: 0.3em; }
  .md-preview h2 { font-size: 1.375rem; border-bottom: 1px solid #2A2A2A; padding-bottom: 0.25em; }
  .md-preview h3 { font-size: 1.125rem; }
  .md-preview h4 { font-size: 1rem; }
  .md-preview p { margin: 0.75em 0; line-height: 1.7; color: #e0e0e0; }
  .md-preview ul, .md-preview ol { margin: 0.75em 0; padding-left: 1.5em; color: #e0e0e0; }
  .md-preview ul { list-style-type: disc; }
  .md-preview ol { list-style-type: decimal; }
  .md-preview li { margin: 0.3em 0; line-height: 1.7; }
  .md-preview li > ul, .md-preview li > ol { margin: 0.2em 0; }
  .md-preview code { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 4px; padding: 0.15em 0.4em; font-size: 0.875em; font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #FF6B6B; }
  .md-preview pre { background: #111111; border: 1px solid #2A2A2A; border-radius: 8px; padding: 1em; overflow-x: auto; margin: 1em 0; }
  .md-preview pre code { background: none; border: none; padding: 0; color: #e0e0e0; font-size: 0.85em; }
  .md-preview blockquote { border-left: 3px solid #FF2222; margin: 1em 0; padding: 0.5em 0 0.5em 1em; color: #A0A0A0; background: #111111; border-radius: 0 6px 6px 0; }
  .md-preview blockquote p { margin: 0; color: #A0A0A0; }
  .md-preview a { color: #FF2222; text-decoration: underline; text-underline-offset: 2px; }
  .md-preview a:hover { color: #CC0000; }
  .md-preview hr { border: none; border-top: 1px solid #2A2A2A; margin: 1.5em 0; }
  .md-preview table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.875rem; }
  .md-preview th { background: #1A1A1A; border: 1px solid #2A2A2A; padding: 0.5em 0.75em; text-align: left; font-weight: 600; color: #ffffff; }
  .md-preview td { border: 1px solid #2A2A2A; padding: 0.5em 0.75em; color: #e0e0e0; }
  .md-preview tr:nth-child(even) td { background: #111111; }
  .md-preview img { max-width: 100%; border-radius: 6px; }
  .md-preview strong { font-weight: 700; color: #ffffff; }
  .md-preview em { font-style: italic; }
`

interface ToolbarItem {
  label: string
  action: (text: string, selStart: number, selEnd: number) => { newText: string; newCursor: number }
  title: string
}

const TOOLBAR: ToolbarItem[] = [
  {
    label: 'B',
    title: 'Negrito',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'texto'
      return { newText: text.slice(0, s) + `**${sel}**` + text.slice(e), newCursor: s + sel.length + 4 }
    },
  },
  {
    label: 'I',
    title: 'Itálico',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'texto'
      return { newText: text.slice(0, s) + `*${sel}*` + text.slice(e), newCursor: s + sel.length + 2 }
    },
  },
  {
    label: 'H1',
    title: 'Título 1',
    action: (text, s) => {
      const lineStart = text.lastIndexOf('\n', s - 1) + 1
      return { newText: text.slice(0, lineStart) + '# ' + text.slice(lineStart), newCursor: s + 2 }
    },
  },
  {
    label: 'H2',
    title: 'Título 2',
    action: (text, s) => {
      const lineStart = text.lastIndexOf('\n', s - 1) + 1
      return { newText: text.slice(0, lineStart) + '## ' + text.slice(lineStart), newCursor: s + 3 }
    },
  },
  {
    label: '`c`',
    title: 'Código inline',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'código'
      return { newText: text.slice(0, s) + '`' + sel + '`' + text.slice(e), newCursor: s + sel.length + 2 }
    },
  },
  {
    label: '[L]',
    title: 'Link',
    action: (text, s, e) => {
      const sel = text.slice(s, e) || 'texto'
      const insert = `[${sel}](url)`
      return { newText: text.slice(0, s) + insert + text.slice(e), newCursor: s + insert.length }
    },
  },
  {
    label: '🖼',
    title: 'Imagem',
    action: (text, s) => {
      const insert = '![alt](url)'
      return { newText: text.slice(0, s) + insert + text.slice(s), newCursor: s + insert.length }
    },
  },
  {
    label: '—',
    title: 'Divisor horizontal',
    action: (text, s) => {
      const insert = '\n\n---\n\n'
      return { newText: text.slice(0, s) + insert + text.slice(s), newCursor: s + insert.length }
    },
  },
  {
    label: '❝',
    title: 'Citação',
    action: (text, s) => {
      const lineStart = text.lastIndexOf('\n', s - 1) + 1
      return { newText: text.slice(0, lineStart) + '> ' + text.slice(lineStart), newCursor: s + 2 }
    },
  },
  {
    label: '•',
    title: 'Lista',
    action: (text, s) => {
      const lineStart = text.lastIndexOf('\n', s - 1) + 1
      return { newText: text.slice(0, lineStart) + '- ' + text.slice(lineStart), newCursor: s + 2 }
    },
  },
]

function computeStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length
  const lines = text.split('\n').length
  const readTime = Math.max(1, Math.ceil(words / 200))
  return { words, chars, lines, readTime }
}

export function MarkdownPreview() {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN)
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor')
  const { toasts, toast, dismiss } = useToast()

  const html = useMemo(() => marked(markdown) as string, [markdown])
  const stats = useMemo(() => computeStats(markdown), [markdown])

  const applyToolbarAction = useCallback((item: ToolbarItem) => {
    const textarea = document.getElementById('md-editor') as HTMLTextAreaElement | null
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const { newText, newCursor } = item.action(markdown, start, end)
    setMarkdown(newText)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursor, newCursor)
    })
  }, [markdown])

  async function handleCopyHtml() {
    try {
      await navigator.clipboard.writeText(html)
      toast({ type: 'success', message: 'HTML copiado para a área de transferência.' })
    } catch {
      toast({ type: 'error', message: 'Falha ao copiar. Tente novamente.' })
    }
  }

  function handleDownloadMd() {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, 'documento.md')
    toast({ type: 'success', message: 'Arquivo .md baixado.' })
  }

  function handleDownloadHtml() {
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Documento</title>
<style>
body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; background: #ffffff; }
h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
h1 { font-size: 2rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3em; }
h2 { font-size: 1.5rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.25em; }
p { margin: 0.75em 0; }
ul, ol { padding-left: 1.5em; margin: 0.75em 0; }
li { margin: 0.25em 0; }
code { background: #f4f4f4; border-radius: 3px; padding: 0.15em 0.4em; font-family: monospace; font-size: 0.9em; }
pre { background: #f4f4f4; border-radius: 6px; padding: 1em; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #cccccc; margin: 1em 0; padding: 0.5em 1em; color: #555555; }
a { color: #0066cc; }
hr { border: none; border-top: 1px solid #e0e0e0; margin: 1.5em 0; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; }
th, td { border: 1px solid #e0e0e0; padding: 0.5em 0.75em; text-align: left; }
th { background: #f8f8f8; font-weight: 600; }
img { max-width: 100%; }
</style>
</head>
<body>
${html}
</body>
</html>`
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, 'documento.html')
    toast({ type: 'success', message: 'Arquivo HTML baixado.' })
  }

  return (
    <>
      <Helmet>
        <title>Markdown Preview — Editor e Visualizador em tempo real | CaosHub</title>
        <meta
          name="description"
          content="Editor de Markdown com prévia em tempo real. Barra de ferramentas, estatísticas do texto e exportação como .md ou .html."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/markdown-preview" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/markdown-preview" />
        <meta property="og:title" content="Markdown Preview — CaosHub" />
        <meta
          property="og:description"
          content="Editor de Markdown com prévia ao vivo, barra de ferramentas e exportação. 100% no navegador."
        />
        <meta name="twitter:title" content="Markdown Preview — CaosHub" />
        <meta
          name="twitter:description"
          content="Editor de Markdown com prévia ao vivo, barra de ferramentas e exportação. 100% no navegador."
        />
      </Helmet>

      <style>{PREVIEW_STYLES}</style>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-6xl mx-auto px-4 py-8 pb-12 space-y-4"
      >
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
            <NotebookPen className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Markdown Preview</h1>
            <p className="text-text-secondary text-sm mt-1">
              Editor com prévia em tempo real. Exporte como .md ou .html.
            </p>
          </div>
        </div>

        {/* Export toolbar */}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="gap-2 text-sm h-8 px-3" onClick={handleCopyHtml}>
            <Copy className="w-3.5 h-3.5" />
            Copiar HTML
          </Button>
          <Button variant="ghost" className="gap-2 text-sm h-8 px-3" onClick={handleDownloadMd}>
            <FileText className="w-3.5 h-3.5" />
            Baixar .md
          </Button>
          <Button variant="ghost" className="gap-2 text-sm h-8 px-3" onClick={handleDownloadHtml}>
            <Download className="w-3.5 h-3.5" />
            Baixar HTML
          </Button>
        </div>

        {/* Mobile tabs */}
        <div className="flex lg:hidden border-b border-border">
          {(['editor', 'preview'] as const).map(t => (
            <button
              key={t}
              onClick={() => setMobileTab(t)}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2',
                mobileTab === t
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t === 'editor' ? (
                <><NotebookPen className="w-3.5 h-3.5" /> Editor</>
              ) : (
                <><Eye className="w-3.5 h-3.5" /> Preview</>
              )}
            </button>
          ))}
        </div>

        {/* Main split layout */}
        <div className="flex gap-4 h-[600px]">
          {/* Editor panel */}
          <div
            className={cn(
              'flex flex-col flex-1 min-w-0 bg-surface border border-border rounded-xl overflow-hidden',
              'hidden lg:flex',
              mobileTab === 'editor' && '!flex',
            )}
          >
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-bg-secondary shrink-0">
              {TOOLBAR.map(item => (
                <button
                  key={item.title}
                  title={item.title}
                  onClick={() => applyToolbarAction(item)}
                  className="px-2 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition-colors font-mono"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              id="md-editor"
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              spellCheck={false}
              className="flex-1 resize-none bg-transparent text-text-primary text-sm font-mono p-4 focus:outline-none placeholder:text-text-secondary/40 leading-relaxed"
              placeholder="Digite seu Markdown aqui..."
            />

            {/* Stats bar */}
            <div className="border-t border-border px-4 py-2 flex flex-wrap gap-4 text-xs text-text-secondary bg-bg-secondary shrink-0">
              <span><span className="text-text-primary font-medium">{stats.words}</span> palavras</span>
              <span><span className="text-text-primary font-medium">{stats.chars}</span> caracteres</span>
              <span><span className="text-text-primary font-medium">{stats.lines}</span> linhas</span>
              <span>~<span className="text-text-primary font-medium">{stats.readTime}</span> min leitura</span>
            </div>
          </div>

          {/* Preview panel */}
          <div
            className={cn(
              'flex flex-col flex-1 min-w-0 bg-surface border border-border rounded-xl overflow-hidden',
              'hidden lg:flex',
              mobileTab === 'preview' && '!flex',
            )}
          >
            <div className="px-4 py-2 border-b border-border bg-bg-secondary shrink-0 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Preview</span>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4 md-preview text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </motion.div>
    </>
  )
}
