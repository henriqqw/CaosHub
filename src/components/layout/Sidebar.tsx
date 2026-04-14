import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  FileType2,
  FileText,
  ImageIcon,
  ImageDown,
  QrCode,
  KeyRound,
  Wand2,
  Clapperboard,
  AudioLines,
  Link2,
  Subtitles,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const categories = [
  {
    label: 'PDF',
    items: [
      { to: '/tools/pdf-converter', label: 'PDF Converter', icon: FileType2 },
      { to: '/tools/merge-pdf', label: 'MergePDF', icon: FileText },
    ],
  },
  {
    label: 'Image',
    items: [
      { to: '/tools/image-converter', label: 'Image Converter', icon: ImageIcon },
      { to: '/tools/image-compressor', label: 'Compress', icon: ImageDown },
      { to: '/tools/background-removal', label: 'Remove BG', icon: Wand2 },
    ],
  },
  {
    label: 'Video / Audio',
    items: [
      { to: '/tools/video-converter', label: 'Video Converter', icon: Clapperboard },
      { to: '/tools/audio-converter', label: 'Audio Converter', icon: AudioLines },
      { to: '/tools/media-downloader', label: 'Media Downloader', icon: Link2 },
      { to: '/tools/transcriber', label: 'Transcriber', icon: Subtitles },
    ],
  },
  {
    label: 'Utility',
    items: [
      { to: '/tools/qr-code', label: 'QR Code', icon: QrCode },
      { to: '/tools/password-generator', label: 'Passwords', icon: KeyRound },
    ],
  },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <NavLink to="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-6 h-6 flex items-center justify-center rounded-md bg-accent/10 border border-accent/20">
            <svg viewBox="0 0 32 32" className="w-3.5 h-3.5">
              <path d="M 23 11 A 8.5 8.5 0 1 0 23 21" stroke="#FF2222" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-bold text-text-primary tracking-tight">CaosHub</span>
        </NavLink>
        {onClose && (
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
            )
          }
        >
          <Home className="w-4 h-4 shrink-0" />
          Home
        </NavLink>

        <div className="h-px bg-border my-2 mx-1" />

        {categories.map(cat => (
          <div key={cat.label}>
            <button
              onClick={() => toggle(cat.label)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors duration-150"
            >
              {cat.label}
              <ChevronDown
                className={cn('w-3 h-3 transition-transform duration-150', collapsed[cat.label] ? '-rotate-90' : '')}
              />
            </button>

            <AnimatePresence initial={false}>
              {!collapsed[cat.label] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  {cat.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-2 ml-2 rounded-lg text-sm transition-colors duration-150',
                          isActive
                            ? 'bg-accent/10 text-accent font-medium'
                            : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
                        )
                      }
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {label}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-[11px] text-text-secondary/50">MIT License - Open Source</p>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary"
      >
        <Menu className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 w-56 bg-bg-secondary border-r border-border lg:hidden"
            >
              <SidebarContent onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-52 bg-bg-secondary border-r border-border">
      <SidebarContent />
    </aside>
  )
}
