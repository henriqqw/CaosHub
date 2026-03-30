import { motion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, Film, ImageIcon, LucideIcon } from 'lucide-react'
import { Button } from '../components/ui/Button'

interface Tool {
  icon: LucideIcon
  name: string
  description: string
  route: string
  accent: string
}

const tools: Tool[] = [
  {
    icon: FileText,
    name: 'MergePDF',
    description: 'Combine multiple PDF files into one. Drag, reorder, and merge — all in your browser.',
    route: '/tools/merge-pdf',
    accent: 'text-accent',
  },
  {
    icon: Film,
    name: 'FrameExtractor',
    description: 'Extract frames from any video file as PNG or JPEG. Export as individual files or a ZIP archive.',
    route: '/tools/frame-extractor',
    accent: 'text-accent',
  },
  {
    icon: ImageIcon,
    name: 'WebP Converter',
    description: 'Convert JPG, PNG, and other images to WebP format with adjustable quality and batch support.',
    route: '/tools/webp-converter',
    accent: 'text-accent',
  },
]

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
}

export function Home() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-12"
    >
      {/* Hero */}
      <div className="text-center pt-8 space-y-3">
        <h1 className="text-4xl font-semibold text-text-primary tracking-tight">
          Caos<span className="text-accent">Hub</span>
        </h1>
        <p className="text-text-secondary text-base max-w-md mx-auto">
          Browser-only tools. No uploads. No server. Your files never leave your device.
        </p>
      </div>

      {/* Tool grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {tools.map(tool => (
          <ToolCard key={tool.route} tool={tool} onOpen={() => navigate(tool.route)} />
        ))}
      </motion.div>
    </motion.div>
  )
}

function ToolCard({ tool, onOpen }: { tool: Tool; onOpen: () => void }) {
  const Icon = tool.icon

  return (
    <motion.div
      variants={item}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      className="group flex flex-col gap-4 p-5 rounded-xl bg-surface border border-border hover:border-accent/40 transition-colors duration-150 cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">{tool.name}</h2>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed flex-1">{tool.description}</p>

      <Button
        variant="ghost"
        className="w-full text-xs"
        onClick={e => {
          e.stopPropagation()
          onOpen()
        }}
      >
        Open tool
      </Button>
    </motion.div>
  )
}
