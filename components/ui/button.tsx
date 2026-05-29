'use client'

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary:   'bg-ink text-paper hover:bg-accent active:scale-[0.98]',
        accent:    'bg-accent text-white hover:bg-accent-2 active:scale-[0.98]',
        secondary: 'bg-paper-2 text-ink border border-paper-3 hover:bg-paper-3 active:scale-[0.98]',
        ghost:     'text-ink-2 hover:bg-paper-2 hover:text-ink',
        outline:   'border border-paper-3 text-ink-2 hover:border-ink-2 hover:text-ink bg-transparent',
        danger:    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
        link:      'text-accent underline-offset-2 hover:underline p-0 h-auto',
      },
      size: {
        sm:   'h-8 px-3 text-[13px] rounded',
        md:   'h-10 px-4 text-[14px] rounded',
        lg:   'h-11 px-6 text-[15px] rounded-md',
        xl:   'h-12 px-8 text-[15px] rounded-md',
        icon: 'h-9 w-9 rounded',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
