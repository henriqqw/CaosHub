import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  Home, FileText, Film, ImageIcon, ImageDown,
  Palette, QrCode, AlignLeft, KeyRound, FileImage, Scissors,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const homeItem = { to: '/', label: 'Home', icon: Home, exact: true }

const toolItems = [
  { to: '/tools/merge-pdf',         label: 'MergePDF',                icon: FileText   },
  { to: '/tools/frame-extractor',   label: 'FrameExtractor',          icon: Film       },
  { to: '/tools/image-converter',   label: 'Image Converter',         icon: ImageIcon  },
  { to: '/tools/image-compressor',  label: 'Image Compressor',        icon: ImageDown  },
  { to: '/tools/color-palette',     label: 'Color Palette',           icon: Palette    },
  { to: '/tools/qr-code',           label: 'QR Code',                 icon: QrCode     },
  { to: '/tools/character-counter', label: 'Contador de Caracteres',  icon: AlignLeft  },
  { to: '/tools/password-generator',label: 'Gerador de Senhas',       icon: KeyRound   },
  { to: '/tools/pdf-to-images',     label: 'PDF para Imagens',        icon: FileImage  },
  { to: '/tools/pdf-splitter',      label: 'Dividir PDF',             icon: Scissors   },
]

export function BubbleMenu() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-full bg-surface border border-border backdrop-blur-sm shadow-lg">
        {/* Logo */}
        <span className="text-sm font-semibold text-accent tracking-tight px-2 mr-1 border-r border-border shrink-0">
          CaosHub
        </span>

        {/* Home */}
        <NavLink
          to={homeItem.to}
          end={homeItem.exact}
          title={homeItem.label}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 shrink-0',
              isActive
                ? 'bg-accent/15 text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
            )
          }
        >
          <homeItem.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{homeItem.label}</span>
        </NavLink>

        {/* Divider */}
        <span className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Tool items — icon only, label in tooltip */}
        {toolItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-xs transition-colors duration-150 shrink-0',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
              )
            }
          >
            <Icon className="w-3.5 h-3.5" />
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}
