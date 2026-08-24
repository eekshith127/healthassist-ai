import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[#2563EB] text-white shadow-subtle hover:bg-[#1D4ED8]',
        primary:
          'bg-[#2563EB] text-white shadow-subtle hover:bg-[#1D4ED8]',
        destructive:
          'bg-[#DC2626] text-white shadow-subtle hover:bg-[#B91C1C]',
        outline:
          'border border-[#E5E7EB] bg-white shadow-subtle hover:bg-[#F3F4F6] text-[#111827]',
        secondary:
          'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]',
        subtle:
          'bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]',
        ghost:
          'hover:bg-[#F3F4F6] hover:text-[#111827] text-[#4B5563]',
        link: 'text-[#2563EB] underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-9 px-3.5 py-2 text-sm',
        sm: 'h-8 rounded-md px-2.5 text-xs',
        lg: 'h-10 px-4 text-sm font-medium',
        icon: 'h-8 w-8 p-0 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText || children}</span>
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
