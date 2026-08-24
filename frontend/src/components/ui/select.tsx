import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]
  error?: boolean
  label?: string
  helperText?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, error, label, helperText, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={id}
            className={cn(
              'flex h-9 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 pr-8 text-xs ring-offset-background placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:ring-1 focus-visible:ring-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50 transition-colors text-[#111827] cursor-pointer',
              error && 'border-[#DC2626] focus-visible:ring-[#DC2626]',
              className
            )}
            ref={ref}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3 pointer-events-none text-slate-400 dark:text-slate-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {helperText && (
          <p className={cn('text-xs', error ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400')}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
