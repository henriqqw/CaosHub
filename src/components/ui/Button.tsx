import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'ghost' | 'danger'

interface ButtonProps {
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
  title?: string
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white border border-accent hover:bg-accent-hover hover:border-accent-hover',
  ghost: 'bg-transparent text-text-primary border border-border hover:border-accent hover:text-accent',
  danger: 'bg-transparent text-error border border-error hover:bg-error/10',
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  onClick,
  type = 'button',
  title,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      title={title}
      whileHover={!disabled && !loading ? { scale: 0.97 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer',
        variants[variant],
        (disabled || loading) && 'opacity-40 pointer-events-none',
        className,
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  )
}
