import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-ink-2 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 px-3 bg-paper-2 border border-paper-3 rounded text-[14px] text-ink placeholder:text-ink-3',
              'transition-colors duration-150',
              'focus:outline-none focus:border-ink-2 focus:bg-paper',
              error && 'border-red-400 focus:border-red-500',
              leftIcon && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-[12px] text-ink-3">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-ink-2 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 bg-paper-2 border border-paper-3 rounded text-[14px] text-ink placeholder:text-ink-3',
            'transition-colors duration-150 resize-none',
            'focus:outline-none focus:border-ink-2 focus:bg-paper',
            error && 'border-red-400 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-[12px] text-ink-3">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
