import { Link } from 'react-router-dom'
import { Github, Twitter, MessageCircle, Instagram, Linkedin, Mail, Heart } from 'lucide-react'

const tools = [
  { label: 'PDF Converter', to: '/tools/pdf-converter' },
  { label: 'MergePDF', to: '/tools/merge-pdf' },
  { label: 'PDF to Images', to: '/tools/pdf-to-images' },
  { label: 'Split PDF', to: '/tools/pdf-splitter' },
  { label: 'Protect PDF', to: '/tools/pdf-protect' },
  { label: 'Image Converter', to: '/tools/image-converter' },
  { label: 'Image Compressor', to: '/tools/image-compressor' },
  { label: 'Color Palette', to: '/tools/color-palette' },
  { label: 'Remove Background', to: '/tools/background-removal' },
  { label: 'Image Editor', to: '/tools/image-editor' },
  { label: 'Favicon Generator', to: '/tools/favicon-generator' },
  { label: 'Frame Extractor', to: '/tools/frame-extractor' },
  { label: 'Video Converter', to: '/tools/video-converter' },
  { label: 'Video Trimmer', to: '/tools/video-trimmer' },
  { label: 'Audio Converter', to: '/tools/audio-converter' },
  { label: 'Media Downloader', to: '/tools/media-downloader' },
  { label: 'Transcriber', to: '/tools/transcriber' },
  { label: 'Character Counter', to: '/tools/character-counter' },
  { label: 'Markdown Preview', to: '/tools/markdown-preview' },
  { label: 'QR Code', to: '/tools/qr-code' },
  { label: 'Password Generator', to: '/tools/password-generator' },
  { label: 'JSON Formatter', to: '/tools/json-formatter' },
  { label: 'Hash Generator', to: '/tools/hash-generator' },
  { label: 'JWT Decoder', to: '/tools/jwt-decoder' },
  { label: 'UUID Generator', to: '/tools/uuid-generator' },
  { label: 'Encoder', to: '/tools/encoder' },
]

const socialLinks = [
  { icon: Github, href: 'https://github.com/henriqqw/CaosHub', label: 'GitHub' },
  { icon: Twitter, href: 'https://twitter.com/caosdev', label: 'Twitter' },
  { icon: MessageCircle, href: '#', label: 'Discord' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:contato@caosdev.com', label: 'Email' },
]

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-bg-secondary mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center rounded-md bg-accent/10 border border-accent/20">
                <svg viewBox="0 0 32 32" className="w-4 h-4">
                  <path d="M 23 11 A 8.5 8.5 0 1 0 23 21" stroke="#FF2222" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-text-primary">CaosHub</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">Open source project - MIT License</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Tools</h3>
            <nav className="grid grid-cols-2 gap-x-4 gap-y-2">
              {tools.map(t => (
                <Link
                  key={t.to}
                  to={t.to}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 truncate"
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Links</h3>
            <div className="flex items-center flex-wrap gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors duration-150"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-text-secondary flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-accent fill-accent" /> by{' '}
            <a
              href="https://caosdev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-medium"
            >
              caosdev
            </a>
          </span>
          <p className="text-xs text-text-secondary text-right max-w-sm">
            Most tools run locally in your browser. Media Downloader and Transcriber use backend services.
          </p>
        </div>
      </div>
    </footer>
  )
}
