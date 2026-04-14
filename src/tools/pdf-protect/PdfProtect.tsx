import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, FileText, ShieldCheck } from 'lucide-react'
import { PDFDocument } from '@cantoo/pdf-lib'
import { FileUploadZone } from '../../components/ui/FileUploadZone'
import { Button } from '../../components/ui/Button'
import { ToastContainer } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { cn, formatBytes, downloadBlob } from '../../lib/utils'

type StrengthLevel = 'fraca' | 'média' | 'forte'

function getStrength(password: string): StrengthLevel {
  if (password.length === 0) return 'fraca'
  if (password.length < 6) return 'fraca'
  if (password.length <= 12) return 'média'
  return 'forte'
}

const strengthConfig: Record<StrengthLevel, { color: string; width: string; label: string }> = {
  fraca: { color: 'bg-error', width: 'w-1/3', label: 'Fraca' },
  média: { color: 'bg-warning', width: 'w-2/3', label: 'Média' },
  forte: { color: 'bg-green-500', width: 'w-full', label: 'Forte' },
}

export function PdfProtect() {
  const [file, setFile] = useState<File | null>(null)
  const [userPassword, setUserPassword] = useState<string>('')
  const [ownerPassword, setOwnerPassword] = useState<string>('')
  const [allowPrint, setAllowPrint] = useState<boolean>(true)
  const [allowCopy, setAllowCopy] = useState<boolean>(true)
  const [allowModify, setAllowModify] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number>(0)
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    if (resultBlob && file) {
      downloadBlob(resultBlob, file.name.replace(/\.pdf$/i, '-protected.pdf'))
    }
  }, [resultBlob])

  const strength = getStrength(userPassword)
  const cfg = strengthConfig[strength]

  function handleFiles(files: File[]) {
    const pdf = files[0]
    if (!pdf) return
    setFile(pdf)
    setResultBlob(null)
  }

  async function handleProtect() {
    if (!file) {
      toast({ type: 'error', message: 'Selecione um arquivo PDF.' })
      return
    }
    if (!userPassword) {
      toast({ type: 'error', message: 'Informe a senha do usuário.' })
      return
    }

    setLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      await pdfDoc.encrypt({
        userPassword,
        ownerPassword: ownerPassword || userPassword,
        permissions: {
          printing: allowPrint ? 'highResolution' : undefined,
          modifying: allowModify,
          copying: allowCopy,
          annotating: true,
          fillingForms: true,
          contentAccessibility: true,
          documentAssembly: false,
        },
      })
      const bytes = await pdfDoc.save()
      const blob = new Blob([(bytes as Uint8Array).buffer as ArrayBuffer], { type: 'application/pdf' })
      setResultBlob(blob)
      setResultSize(blob.size)
      toast({ type: 'success', message: 'PDF protegido com sucesso!' })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', message: 'Erro ao proteger o PDF. Verifique se o arquivo é válido.' })
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!resultBlob || !file) return
    const baseName = file.name.replace(/\.pdf$/i, '')
    downloadBlob(resultBlob, `${baseName}-protegido.pdf`)
    toast({ type: 'success', message: 'Download iniciado.' })
  }

  return (
    <>
      <Helmet>
        <title>Proteger PDF com Senha — Criptografia no navegador | CaosHub</title>
        <meta
          name="description"
          content="Adicione senha e permissões ao seu PDF diretamente no navegador, sem enviar arquivos para servidores. Criptografia AES 256-bit com pdf-lib."
        />
        <link rel="canonical" href="https://caoshub.vercel.app/tools/pdf-protect" />
        <meta property="og:url" content="https://caoshub.vercel.app/tools/pdf-protect" />
        <meta property="og:title" content="Proteger PDF com Senha — CaosHub" />
        <meta
          property="og:description"
          content="Adicione senha e permissões ao seu PDF no navegador. Nenhum arquivo sai do seu dispositivo."
        />
        <meta name="twitter:title" content="Proteger PDF com Senha — CaosHub" />
        <meta
          name="twitter:description"
          content="Adicione senha e permissões ao seu PDF no navegador. Nenhum arquivo sai do seu dispositivo."
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
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Proteger PDF com Senha</h1>
            <p className="text-text-secondary text-sm mt-1">
              Criptografe seu PDF no navegador. Nenhum arquivo sai do seu dispositivo.
            </p>
          </div>
        </div>

        {/* Upload */}
        <FileUploadZone
          accept={['application/pdf', '.pdf']}
          multiple={false}
          onFiles={handleFiles}
          label="Arraste o PDF aqui ou clique para selecionar"
          hint="Apenas arquivos PDF"
        />

        {/* File info */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3"
            >
              <FileText className="w-5 h-5 text-accent shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                <p className="text-xs text-text-secondary">{formatBytes(file.size)}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password config */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-medium text-text-primary">Senhas</h2>

          {/* User password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Senha do usuário <span className="text-error">*</span>
            </label>
            <input
              type="password"
              value={userPassword}
              onChange={e => setUserPassword(e.target.value)}
              placeholder="Senha para abrir o documento"
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
            />
            {/* Strength indicator */}
            {userPassword.length > 0 && (
              <div className="space-y-1">
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-300', cfg.color, cfg.width)} />
                </div>
                <p className={cn('text-xs', strength === 'fraca' ? 'text-error' : strength === 'média' ? 'text-warning' : 'text-green-500')}>
                  Força: {cfg.label}
                </p>
              </div>
            )}
          </div>

          {/* Owner password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Senha do proprietário <span className="text-text-secondary/50">(opcional)</span>
            </label>
            <input
              type="password"
              value={ownerPassword}
              onChange={e => setOwnerPassword(e.target.value)}
              placeholder="Deixe em branco para usar a mesma senha"
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-text-secondary">
              Controla permissões de edição. Se vazio, usa a senha do usuário.
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium text-text-primary">Permissões</h2>
          <div className="space-y-2">
            {[
              { label: 'Permitir impressão', value: allowPrint, set: setAllowPrint },
              { label: 'Permitir cópia de texto', value: allowCopy, set: setAllowCopy },
              { label: 'Permitir modificação', value: allowModify, set: setAllowModify },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => set(!value)}
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                    value ? 'bg-accent border-accent' : 'bg-transparent border-border group-hover:border-accent/50',
                  )}
                >
                  {value && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-text-primary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action */}
        <Button
          className="w-full"
          loading={loading}
          disabled={!file || !userPassword}
          onClick={handleProtect}
        >
          <ShieldCheck className="w-4 h-4" />
          Proteger PDF
        </Button>

        {/* Result */}
        <AnimatePresence>
          {resultBlob && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <p className="text-sm font-medium text-text-primary">PDF protegido</p>
                <span className="text-xs text-text-secondary ml-auto">{formatBytes(resultSize)}</span>
              </div>
              <Button variant="ghost" className="w-full" onClick={handleDownload}>
                Baixar PDF protegido
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Note */}
        <p className="text-xs text-text-secondary text-center">
          Para remover a proteção, use a ferramenta correspondente (em breve).
        </p>
      </motion.div>
    </>
  )
}
