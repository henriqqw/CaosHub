import { Helmet } from 'react-helmet-async'
import { motion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Film, ImageIcon, Github, Shield, UserX,
  WifiOff, Code2, ArrowRight, ImageDown, Palette,
  QrCode, AlignLeft, KeyRound, FileImage, Scissors, Wand2,
  SlidersHorizontal, Layers, Clapperboard, Timer, AudioLines,
  Lock, NotebookPen, Braces, Hash, KeySquare, Shuffle, Binary,
} from 'lucide-react'
import { Button } from '../components/ui/Button'

// ─── animation presets ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

const stagger = (delay = 0.07): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})

// ─── data ─────────────────────────────────────────────────────────────────────

const tools = [
  {
    icon: FileText,
    name: 'MergePDF',
    route: '/tools/merge-pdf',
    tag: 'PDF',
    headline: 'Junta PDFs. Ponto.',
    description:
      'Arrasta, reordena e mescla quantos PDFs quiser. Sem limite de tamanho imposto por servidor — porque não tem servidor.',
    features: ['Arraste pra reordenar', 'Thumbnail de cada página', 'Download direto'],
  },
  {
    icon: Film,
    name: 'FrameExtractor',
    route: '/tools/frame-extractor',
    tag: 'VÍDEO',
    headline: 'Todo frame que você precisar.',
    description:
      'Abre qualquer vídeo, configura o intervalo, e extrai os frames como PNG ou JPEG. Exporta tudo num ZIP se quiser.',
    features: ['Por FPS ou por contagem', 'PNG lossless ou JPEG', 'Export em ZIP'],
  },
  {
    icon: ImageIcon,
    name: 'Image Converter',
    route: '/tools/image-converter',
    tag: 'IMAGEM',
    headline: 'JPEG, PNG, WebP. Você escolhe.',
    description:
      'Converte qualquer imagem pro formato que você precisa, com controle de qualidade e comparação de tamanho em tempo real.',
    features: ['Batch processing', 'Controle de qualidade', 'Tamanho antes e depois'],
  },
  {
    icon: ImageDown,
    name: 'Image Compressor',
    route: '/tools/image-compressor',
    tag: 'IMAGEM',
    headline: 'Menos bytes, mesma qualidade.',
    description:
      'Comprima imagens JPEG, PNG e WebP direto no navegador com controle de qualidade e comparação antes/depois em tempo real.',
    features: ['JPEG, PNG, WebP', 'Slider de qualidade', 'Download em ZIP'],
  },
  {
    icon: Palette,
    name: 'Color Palette',
    route: '/tools/color-palette',
    tag: 'DESIGN',
    headline: 'A paleta já está na imagem.',
    description:
      'Carregue qualquer imagem e extraia automaticamente as cores dominantes com valores hex e RGB. Copie como variáveis CSS.',
    features: ['Cores dominantes', 'Hex + RGB', 'Variáveis CSS'],
  },
  {
    icon: QrCode,
    name: 'QR Code',
    route: '/tools/qr-code',
    tag: 'UTILIDADE',
    headline: 'QR code em segundos.',
    description:
      'Cole um link, texto ou email e gere um QR code instantaneamente. Baixe em PNG ou SVG com controle de tamanho e correção de erro.',
    features: ['PNG e SVG', 'Tamanho ajustável', 'Sem upload'],
  },
  {
    icon: AlignLeft,
    name: 'Contador de Caracteres',
    route: '/tools/character-counter',
    tag: 'TEXTO',
    headline: 'Tudo sobre o seu texto.',
    description:
      'Conta caracteres, palavras, frases e parágrafos em tempo real. Veja o tempo de leitura estimado e muito mais.',
    features: ['Palavras únicas', 'Tempo de leitura', 'Estatísticas completas'],
  },
  {
    icon: KeyRound,
    name: 'Gerador de Senhas',
    route: '/tools/password-generator',
    tag: 'SEGURANÇA',
    headline: 'Senhas fortes, geradas aqui.',
    description:
      'Gere senhas criptograficamente seguras com controle total sobre comprimento e tipos de caracteres. Geração em lote incluída.',
    features: ['Crypto-seguro', 'Indicador de força', 'Geração em lote'],
  },
  {
    icon: FileImage,
    name: 'PDF para Imagens',
    route: '/tools/pdf-to-images',
    tag: 'PDF',
    headline: 'PDF vira imagem em um clique.',
    description:
      'Converta páginas de PDF em PNG ou JPEG direto no navegador. Escolha a resolução, selecione as páginas e baixe tudo em ZIP.',
    features: ['PNG e JPEG', 'Resolução 1×/2×/3×', 'Download em ZIP'],
  },
  {
    icon: Scissors,
    name: 'Dividir PDF',
    route: '/tools/pdf-splitter',
    tag: 'PDF',
    headline: 'Corte o PDF onde quiser.',
    description:
      'Separe páginas individuais, divida em blocos de N páginas ou extraia uma seleção específica. 100% no navegador.',
    features: ['Por página, bloco ou seleção', 'Baixar tudo em ZIP', 'Sem limite de tamanho'],
  },
  {
    icon: Wand2,
    name: 'Remover Fundo',
    route: '/tools/background-removal',
    tag: 'IMAGEM',
    headline: 'Fundo removido com IA.',
    description: 'Remova o fundo de qualquer imagem com IA direto no navegador. PNG transparente, sem servidores.',
    features: ['IA no navegador', 'PNG transparente', 'Sem servidores'],
  },
  {
    icon: SlidersHorizontal,
    name: 'Editor de Imagem',
    route: '/tools/image-editor',
    tag: 'IMAGEM',
    headline: 'Redimensionar, recortar, espelhar.',
    description: 'Redimensione, recorte, rotacione e espelhe imagens com total controle. Canvas API puro.',
    features: ['Resize com proporção', 'Flip/Rotate', 'Crop manual'],
  },
  {
    icon: Layers,
    name: 'Favicon Generator',
    route: '/tools/favicon-generator',
    tag: 'IMAGEM',
    headline: 'Todos os tamanhos em um clique.',
    description: 'Gere favicons em 10 tamanhos diferentes a partir de qualquer imagem. Download em ZIP.',
    features: ['10 tamanhos', 'PNG', 'Download ZIP'],
  },
  {
    icon: Clapperboard,
    name: 'Converter Vídeo',
    route: '/tools/video-converter',
    tag: 'VÍDEO',
    headline: 'MP4, WebM, MKV no browser.',
    description: 'Converta vídeos entre formatos usando FFmpeg.wasm. 100% local, sem upload para servidores.',
    features: ['MP4 / WebM / MKV', 'Controle de qualidade', 'FFmpeg.wasm'],
  },
  {
    icon: Timer,
    name: 'Cortar Vídeo',
    route: '/tools/video-trimmer',
    tag: 'VÍDEO',
    headline: 'Trim sem re-encoding.',
    description: 'Recorte um trecho do vídeo definindo início e fim. Stream copy — sem perda de qualidade.',
    features: ['Sem re-encoding', 'Qualquer formato', 'FFmpeg.wasm'],
  },
  {
    icon: AudioLines,
    name: 'Converter Áudio',
    route: '/tools/audio-converter',
    tag: 'VÍDEO',
    headline: 'MP3, WAV, OGG, FLAC.',
    description: 'Converta áudio entre formatos ou extraia o áudio de um vídeo. Controle de bitrate para MP3.',
    features: ['Extrai áudio de vídeo', 'MP3 / WAV / OGG / FLAC', 'Bitrate ajustável'],
  },
  {
    icon: Lock,
    name: 'Proteger PDF',
    route: '/tools/pdf-protect',
    tag: 'PDF',
    headline: 'Senha no PDF, sem servidor.',
    description: 'Adicione senha de abertura e permissões ao seu PDF usando pdf-lib, 100% no navegador.',
    features: ['Senha de abertura', 'Permissões granulares', 'pdf-lib'],
  },
  {
    icon: NotebookPen,
    name: 'Markdown Preview',
    route: '/tools/markdown-preview',
    tag: 'TEXTO',
    headline: 'Editor + preview em tempo real.',
    description: 'Escreva Markdown com preview ao vivo, toolbar de formatação e export para HTML ou .md.',
    features: ['Preview ao vivo', 'Export HTML / .md', 'Toolbar de formatação'],
  },
  {
    icon: Braces,
    name: 'JSON Formatter',
    route: '/tools/json-formatter',
    tag: 'DEV',
    headline: 'Formatar, minificar, validar.',
    description: 'Cole JSON e formate, minifique ou valide instantaneamente. Sem dependências externas.',
    features: ['Formatar / Minificar', 'Validação com erro', 'Ctrl+Enter'],
  },
  {
    icon: Hash,
    name: 'Hash Generator',
    route: '/tools/hash-generator',
    tag: 'DEV',
    headline: 'MD5, SHA-256, SHA-512.',
    description: 'Gere hashes criptográficos de texto ou arquivos. MD5, SHA-1, SHA-256, SHA-384, SHA-512.',
    features: ['Texto ou arquivo', 'MD5 + SHA nativo', 'Copiar resultado'],
  },
  {
    icon: KeySquare,
    name: 'JWT Decoder',
    route: '/tools/jwt-decoder',
    tag: 'DEV',
    headline: 'Decodifique tokens JWT.',
    description: 'Decodifique header, payload e assinatura de tokens JWT. Exibe expiração e campos padrão.',
    features: ['Header / Payload', 'Status de expiração', 'Zero deps'],
  },
  {
    icon: Shuffle,
    name: 'UUID Generator',
    route: '/tools/uuid-generator',
    tag: 'DEV',
    headline: 'UUID v4 crypto-seguro.',
    description: 'Gere UUIDs v4 criptograficamente seguros. Modo lote, formatos e download em .txt.',
    features: ['crypto.randomUUID()', 'Modo lote', 'Vários formatos'],
  },
  {
    icon: Binary,
    name: 'Encoder',
    route: '/tools/encoder',
    tag: 'DEV',
    headline: 'Base64, URL e HTML.',
    description: 'Codifique e decodifique Base64, URL e entidades HTML. Também converte arquivo para Base64.',
    features: ['Base64 / URL / HTML', 'Arquivo → Base64', 'Zero deps'],
  },
]

const pillars = [
  {
    icon: Shield,
    title: 'Privacidade de verdade',
    body: 'Seus arquivos ficam no seu computador. A gente nem tem servidor pra receber.',
  },
  {
    icon: UserX,
    title: 'Zero cadastro',
    body: 'Não tem login. Não tem email. Não tem nada. Abre e usa.',
  },
  {
    icon: WifiOff,
    title: 'Roda offline',
    body: 'Depois de carregar uma vez, funciona sem internet. Sem dependência externa.',
  },
  {
    icon: Code2,
    title: 'Código aberto',
    body: 'MIT License. Pode ver, pode mudar, pode contribuir. Sem segredo.',
  },
]

const stats = [
  { value: '23', label: 'Ferramentas' },
  { value: '8.2k+', label: 'Uploads' },
  { value: '12.4k+', label: 'Processados' },
  { value: '100%', label: 'No navegador' },
]

// ─── terminal mock ─────────────────────────────────────────────────────────────

const terminalLines = [
  { text: '→ Carregando arquivos...', color: 'text-text-secondary' },
  { text: '✓ relatorio-q3.pdf (2.3 MB)', color: 'text-success' },
  { text: '✓ contrato-final.pdf (890 KB)', color: 'text-success' },
  { text: '✓ proposta-v2.pdf (1.1 MB)', color: 'text-success' },
  { text: '→ Mesclando 3 arquivos...', color: 'text-text-secondary' },
  { text: '✓ merged.pdf pronto — 4.2 MB', color: 'text-accent' },
]

// ─── sections ─────────────────────────────────────────────────────────────────

function HeroSection({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 pb-16 overflow-hidden">
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6"
      >
        {/* badge */}
        <motion.span
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Open Source • MIT License
        </motion.span>

        {/* headline */}
        <motion.div variants={fadeUp} className="space-y-3">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            <span className="text-text-primary">Caos</span><span className="text-accent">Hub</span>
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-text-secondary">
            Todas as suas ferramentas web em um só lugar.
          </p>
        </motion.div>

        {/* subtext */}
        <motion.p
          variants={fadeUp}
          className="text-text-secondary text-base sm:text-lg max-w-xl leading-relaxed"
        >
          Processa PDFs, vídeos e imagens direto no navegador.{' '}
          <span className="text-text-primary font-medium">
            Nenhum arquivo sai do seu computador.
          </span>{' '}
          Sem upload, sem cadastro, sem espera.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap justify-center">
          <Button onClick={() => navigate('/tools/merge-pdf')} className="gap-2 px-6 py-2.5">
            Abrir uma ferramenta
            <ArrowRight className="w-4 h-4" />
          </Button>
          <a
            href="https://github.com/henriqqw/CaosHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" className="gap-2 px-6 py-2.5">
              <Github className="w-4 h-4" />
              Ver no GitHub
            </Button>
          </a>
        </motion.div>

        {/* terminal mock */}
        <motion.div
          variants={fadeUp}
          className="w-full max-w-md rounded-xl border border-border bg-bg-secondary overflow-hidden shadow-xl shadow-black/40 text-left"
        >
          {/* window bar */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-text-secondary font-mono">CaosHub — MergePDF</span>
          </div>
          {/* log lines */}
          <div className="px-4 py-4 font-mono text-xs space-y-1.5">
            {terminalLines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.18, duration: 0.2 }}
                className={line.color}
              >
                {line.text}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function WhySection() {
  return (
    <section className="px-4 py-20 ">
      <div className="max-w-5xl mx-auto space-y-12">
        <motion.div
          variants={stagger()}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center space-y-3"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-text-primary">
            O que você precisa.{' '}
            <span className="text-text-secondary font-normal">Nada que você não precisa.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text-secondary max-w-md mx-auto">
            Construído pra quem cansa de mandar arquivo pra servidor de terceiro pra fazer coisa simples.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {pillars.map(p => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              className="flex gap-4 p-5 rounded-xl bg-surface border border-border"
            >
              <div className="p-2 h-fit rounded-lg bg-accent/10 border border-accent/20 shrink-0">
                <p.icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{p.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{p.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function ToolsSection({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="px-4 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <motion.div
          variants={stagger()}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center space-y-2"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-text-primary">
            23 ferramentas.{' '}
            <span className="text-accent">Simples de propósito.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text-secondary text-sm max-w-md mx-auto">
            Cada uma faz uma coisa bem feita. Sem bloat, sem assinatura.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          {tools.map(tool => (
            <motion.div
              key={tool.route}
              variants={fadeUp}
              whileHover={{ scale: 1.03, borderColor: 'rgba(255,34,34,0.4)' }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3 p-4 rounded-xl bg-surface border border-border cursor-pointer"
              onClick={() => navigate(tool.route)}
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
                  <tool.icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[9px] font-bold text-text-secondary/60 tracking-widest">
                  {tool.tag}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary leading-snug">{tool.name}</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-snug line-clamp-2">{tool.headline}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section className="px-4 py-16 ">
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center"
      >
        {stats.map(s => (
          <motion.div key={s.label} variants={fadeUp} className="space-y-1">
            <p className="text-4xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary uppercase tracking-widest">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function CtaSection({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="px-4 py-20 ">
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="rounded-2xl border border-border bg-bg-secondary p-8 sm:p-12 text-center space-y-6">
          <motion.div variants={fadeUp} className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              v0.1.0 — Versão inicial
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight">
              Qual problema você
              <br />quer resolver?
            </h2>
            <p className="text-text-secondary text-sm">
              Escolhe a ferramenta e começa agora.
              <br />
              Sem login, sem setup, sem espera.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-2 justify-center">
            {tools.map(tool => (
              <button
                key={tool.route}
                onClick={() => navigate(tool.route)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface hover:border-accent/50 hover:bg-accent/5 text-xs text-text-primary font-medium transition-colors duration-150"
              >
                <tool.icon className="w-3.5 h-3.5 text-accent shrink-0" />
                {tool.name}
              </button>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function Home() {
  const navigate = useNavigate()
  return (
    <>
      <Helmet>
        <title>CaosHub — Ferramentas online gratuitas, direto no navegador</title>
        <meta name="description" content="CaosHub oferece ferramentas gratuitas que rodam 100% no navegador. Sem uploads para servidores, sem cadastro. Mescle PDFs, extraia frames de vídeos, converta imagens e muito mais." />
        <link rel="canonical" href="https://caoshub.vercel.app/" />
        <meta property="og:url" content="https://caoshub.vercel.app/" />
        <meta property="og:title" content="CaosHub — Ferramentas online gratuitas, direto no navegador" />
        <meta property="og:description" content="Ferramentas gratuitas que rodam 100% no navegador. Sem uploads para servidores, sem cadastro. Mescle PDFs, extraia frames de vídeos, converta imagens." />
        <meta name="twitter:url" content="https://caoshub.vercel.app/" />
        <meta name="twitter:title" content="CaosHub — Ferramentas online gratuitas, direto no navegador" />
        <meta name="twitter:description" content="Ferramentas gratuitas que rodam 100% no navegador. Sem uploads para servidores, sem cadastro." />
      </Helmet>
      <div>
      <HeroSection navigate={navigate} />
      <WhySection />
      <ToolsSection navigate={navigate} />
      <StatsSection />
      <CtaSection navigate={navigate} />
    </div>
    </>
  )
}
