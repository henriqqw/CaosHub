import { Helmet } from 'react-helmet-async'
import { motion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  FileType2,
  Film,
  ImageIcon,
  Github,
  Shield,
  UserX,
  WifiOff,
  Code2,
  ArrowRight,
  ImageDown,
  Palette,
  QrCode,
  AlignLeft,
  KeyRound,
  FileImage,
  Scissors,
  Wand2,
  SlidersHorizontal,
  Layers,
  Clapperboard,
  Timer,
  AudioLines,
  Link2,
  Subtitles,
  Lock,
  NotebookPen,
  Braces,
  Hash,
  KeySquare,
  Shuffle,
  Binary,
} from 'lucide-react'
import { Button } from '../components/ui/Button'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

const stagger = (delay = 0.07): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})

type ToolCard = {
  icon: React.ComponentType<{ className?: string }>
  name: string
  route: string
  tag: string
  headline: string
}

const tools: ToolCard[] = [
  { icon: FileType2, name: 'PDF Converter', route: '/tools/pdf-converter', tag: 'PDF', headline: 'Convert PDF pages to PNG, JPG and WebP.' },
  { icon: FileText, name: 'MergePDF', route: '/tools/merge-pdf', tag: 'PDF', headline: 'Merge PDF files fast.' },
  { icon: Film, name: 'Frame Extractor', route: '/tools/frame-extractor', tag: 'VIDEO', headline: 'Extract frames from any video.' },
  { icon: ImageIcon, name: 'Image Converter', route: '/tools/image-converter', tag: 'IMAGE', headline: 'Convert JPG, PNG and WebP.' },
  { icon: ImageDown, name: 'Image Compressor', route: '/tools/image-compressor', tag: 'IMAGE', headline: 'Reduce size with quality control.' },
  { icon: Palette, name: 'Color Palette', route: '/tools/color-palette', tag: 'DESIGN', headline: 'Extract dominant colors from images.' },
  { icon: QrCode, name: 'QR Code', route: '/tools/qr-code', tag: 'UTILITY', headline: 'Generate QR code in seconds.' },
  { icon: AlignLeft, name: 'Character Counter', route: '/tools/character-counter', tag: 'TEXT', headline: 'Text stats in real time.' },
  { icon: KeyRound, name: 'Password Generator', route: '/tools/password-generator', tag: 'SECURITY', headline: 'Generate strong passwords.' },
  { icon: FileImage, name: 'PDF to Images', route: '/tools/pdf-to-images', tag: 'PDF', headline: 'Render PDF pages as images.' },
  { icon: Scissors, name: 'Split PDF', route: '/tools/pdf-splitter', tag: 'PDF', headline: 'Split by page, range or chunk.' },
  { icon: Wand2, name: 'Background Removal', route: '/tools/background-removal', tag: 'IMAGE', headline: 'Remove background with AI.' },
  { icon: SlidersHorizontal, name: 'Image Editor', route: '/tools/image-editor', tag: 'IMAGE', headline: 'Resize, crop, rotate and flip.' },
  { icon: Layers, name: 'Favicon Generator', route: '/tools/favicon-generator', tag: 'IMAGE', headline: 'Generate multiple favicon sizes.' },
  { icon: Clapperboard, name: 'Video Converter', route: '/tools/video-converter', tag: 'VIDEO', headline: 'Convert video formats locally.' },
  { icon: Timer, name: 'Video Trimmer', route: '/tools/video-trimmer', tag: 'VIDEO', headline: 'Trim videos quickly.' },
  { icon: AudioLines, name: 'Audio Converter', route: '/tools/audio-converter', tag: 'AUDIO', headline: 'Convert and extract audio.' },
  { icon: Link2, name: 'Media Downloader', route: '/tools/media-downloader', tag: 'MEDIA', headline: 'Download URL media as MP4 or MP3.' },
  { icon: Subtitles, name: 'Transcriber', route: '/tools/transcriber', tag: 'AI', headline: 'Whisper transcript and SRT subtitles.' },
  { icon: Lock, name: 'Protect PDF', route: '/tools/pdf-protect', tag: 'PDF', headline: 'Add password and permissions.' },
  { icon: NotebookPen, name: 'Markdown Preview', route: '/tools/markdown-preview', tag: 'TEXT', headline: 'Editor with live preview.' },
  { icon: Braces, name: 'JSON Formatter', route: '/tools/json-formatter', tag: 'DEV', headline: 'Format, minify and validate JSON.' },
  { icon: Hash, name: 'Hash Generator', route: '/tools/hash-generator', tag: 'DEV', headline: 'Generate MD5 and SHA hashes.' },
  { icon: KeySquare, name: 'JWT Decoder', route: '/tools/jwt-decoder', tag: 'DEV', headline: 'Decode token payload fast.' },
  { icon: Shuffle, name: 'UUID Generator', route: '/tools/uuid-generator', tag: 'DEV', headline: 'Generate UUID v4 in batch.' },
  { icon: Binary, name: 'Encoder', route: '/tools/encoder', tag: 'DEV', headline: 'Encode/decode Base64, URL, HTML.' },
]

const pillars = [
  { icon: Shield, title: 'Privacy first', body: 'Most tools run fully in your browser.' },
  { icon: UserX, title: 'No account needed', body: 'Open and use. No signup required.' },
  { icon: WifiOff, title: 'Works offline', body: 'After first load, many tools still work offline.' },
  { icon: Code2, title: 'Open source', body: 'MIT licensed and transparent codebase.' },
]

const stats = [
  { value: String(tools.length), label: 'Tools' },
  { value: '8.2k+', label: 'Uploads' },
  { value: '12.4k+', label: 'Processed' },
  { value: '2', label: 'Backend tools' },
]

function HeroSection({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 pb-16 overflow-hidden">
      <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
        <motion.span variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Open Source - MIT License
        </motion.span>

        <motion.div variants={fadeUp} className="space-y-3">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            <span className="text-text-primary">Caos</span><span className="text-accent">Hub</span>
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-text-secondary">All your web tools in one place.</p>
        </motion.div>

        <motion.p variants={fadeUp} className="text-text-secondary text-base sm:text-lg max-w-xl leading-relaxed">
          Process PDFs, videos and images directly in the browser. Most tools are local.
          <span className="text-text-primary font-medium"> Media Downloader and Transcriber use backend processing.</span>
        </motion.p>

        <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap justify-center">
          <Button onClick={() => navigate('/tools/image-converter')} className="gap-2 px-6 py-2.5">
            Open a tool
            <ArrowRight className="w-4 h-4" />
          </Button>
          <a href="https://github.com/henriqqw/CaosHub" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" className="gap-2 px-6 py-2.5">
              <Github className="w-4 h-4" />
              View on GitHub
            </Button>
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

function WhySection() {
  return (
    <section className="px-4 py-20">
      <div className="max-w-5xl mx-auto space-y-12">
        <motion.div variants={stagger()} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="text-center space-y-3">
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-text-primary">
            Built for speed. <span className="text-text-secondary font-normal">No unnecessary steps.</span>
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pillars.map(p => (
            <motion.div key={p.title} variants={fadeUp} className="flex gap-4 p-5 rounded-xl bg-surface border border-border">
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
        <motion.div variants={stagger()} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="text-center space-y-2">
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-text-primary">
            {tools.length} tools. <span className="text-accent">Focused and fast.</span>
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger(0.06)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                <span className="text-[9px] font-bold text-text-secondary/60 tracking-widest">{tool.tag}</span>
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
    <section className="px-4 py-16">
      <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
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

export function Home() {
  const navigate = useNavigate()

  return (
    <>
      <Helmet>
        <title>CaosHub - Free online tools</title>
        <meta name="description" content="Free tools for PDF, image, video and dev workflows. Media Downloader uses backend processing for URL downloads." />
        <link rel="canonical" href="https://caoshub.vercel.app/" />
        <meta property="og:url" content="https://caoshub.vercel.app/" />
        <meta property="og:title" content="CaosHub - Free online tools" />
        <meta property="og:description" content="Fast web tools in one place. Includes Media Downloader for URL to MP4/MP3 workflows." />
        <meta name="twitter:url" content="https://caoshub.vercel.app/" />
        <meta name="twitter:title" content="CaosHub - Free online tools" />
        <meta name="twitter:description" content="Fast web tools in one place. Includes Media Downloader for URL to MP4/MP3 workflows." />
      </Helmet>

      <div>
        <HeroSection navigate={navigate} />
        <WhySection />
        <ToolsSection navigate={navigate} />
        <StatsSection />
      </div>
    </>
  )
}
