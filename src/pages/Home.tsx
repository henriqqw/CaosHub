import { Helmet } from 'react-helmet-async'
import { motion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Film, ImageIcon, Github, Shield, UserX,
  WifiOff, Code2, ArrowRight, Check,
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
  { value: '3', label: 'Ferramentas' },
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
            3 ferramentas.{' '}
            <span className="text-accent">Simples de propósito.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text-secondary max-w-md mx-auto">
            Cada uma faz uma coisa bem feita. Sem feature bloat, sem assinatura premium pra destravar o básico.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {tools.map(tool => (
            <motion.div
              key={tool.route}
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4 p-5 rounded-xl bg-surface border border-border hover:border-accent/40 cursor-pointer transition-colors duration-150"
              onClick={() => navigate(tool.route)}
            >
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                  <tool.icon className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary tracking-widest border border-border px-2 py-0.5 rounded">
                  {tool.tag}
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-1">{tool.headline}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{tool.description}</p>
              </div>

              <ul className="space-y-1.5 mt-auto">
                {tool.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:gap-2.5 transition-all duration-150"
                onClick={e => { e.stopPropagation(); navigate(tool.route) }}
              >
                Abrir ferramenta <ArrowRight className="w-3.5 h-3.5" />
              </button>
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

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
            {tools.map(tool => (
              <button
                key={tool.route}
                onClick={() => navigate(tool.route)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface hover:border-accent/50 hover:bg-accent/5 text-sm text-text-primary font-medium transition-colors duration-150"
              >
                <tool.icon className="w-4 h-4 text-accent" />
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
