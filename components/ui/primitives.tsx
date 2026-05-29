import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

// ─── Badge ─────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-mono text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-sm',
  {
    variants: {
      variant: {
        default:  'bg-paper-2 text-ink-2 border border-paper-3',
        accent:   'bg-accent text-white',
        success:  'bg-sea-green-light text-sea-green',
        warning:  'bg-amber-100 text-amber-800',
        info:     'bg-blue-100 text-blue-800',
        purple:   'bg-purple-100 text-purple-800',
        free:     'bg-paper-2 text-ink-3 border border-paper-3',
        pro:      'bg-ink text-paper',
        new:      'bg-accent text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode
  className?: string
}

function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  as?: 'div' | 'article' | 'section' | 'li'
}

function Card({ children, className, hover, onClick, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-paper border border-paper-3 rounded-md p-5',
        'shadow-card',
        hover && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Tag>
  )
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-serif text-xl text-ink leading-tight', className)}>
      {children}
    </h3>
  )
}

function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-[14px] text-ink-2', className)}>{children}</div>
}

// ─── ProgressBar ───────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number        // 0–100
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'accent' | 'green' | 'blue' | 'amber'
  showLabel?: boolean
  label?: string
  className?: string
  animated?: boolean
}

function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'accent',
  showLabel,
  label,
  className,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' }
  const colors = {
    accent: 'bg-accent',
    green:  'bg-sea-green',
    blue:   'bg-blue-500',
    amber:  'bg-amber-500',
  }

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-[12px] font-medium text-ink-2">{label}</span>}
          {showLabel && <span className="text-[12px] text-ink-3 font-mono">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-paper-3 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            colors[color],
            heights[size],
            'rounded-full',
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded', className)} />
}

function SkeletonCard() {
  return (
    <Card>
      <Skeleton className="h-5 w-2/3 mb-3" />
      <Skeleton className="h-3.5 w-full mb-2" />
      <Skeleton className="h-3.5 w-4/5 mb-2" />
      <Skeleton className="h-3.5 w-1/2" />
    </Card>
  )
}

export { Badge, Card, CardHeader, CardTitle, CardBody, ProgressBar, Skeleton, SkeletonCard }
