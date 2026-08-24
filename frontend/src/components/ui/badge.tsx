import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[#DBEAFE] bg-[#EFF6FF] text-[#1D4ED8]',
        secondary:
          'border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]',
        destructive:
          'border-red-200 bg-red-50 text-[#DC2626]',
        warning:
          'border-amber-200 bg-amber-50 text-[#D97706]',
        outline: 'border-[#E5E7EB] bg-white text-[#111827]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
