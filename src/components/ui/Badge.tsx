import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'accent'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'text-text-secondary bg-surface border-border',
  success: 'text-success bg-success/10 border-success/30',
  error: 'text-error bg-error/10 border-error/30',
  warning: 'text-warning bg-warning/10 border-warning/30',
  accent: 'text-accent bg-accent/10 border-accent/30',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
