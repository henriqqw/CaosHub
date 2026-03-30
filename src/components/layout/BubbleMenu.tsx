import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { FileText, Film, ImageIcon, Home } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/tools/merge-pdf', label: 'MergePDF', icon: FileText, exact: false },
  { to: '/tools/frame-extractor', label: 'FrameExtractor', icon: Film, exact: false },
  { to: '/tools/image-converter', label: 'Image Converter', icon: ImageIcon, exact: false },
]

export function BubbleMenu() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-surface border border-border backdrop-blur-sm shadow-lg">
        {/* Logo */}
        <span className="text-sm font-semibold text-accent tracking-tight px-2 mr-1 border-r border-border">
          CaosHub
        </span>

        {/* Nav links */}
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
              )
            }
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}
