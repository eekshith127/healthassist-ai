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
              'flex h-10 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 pr-9 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all text-slate-900 dark:text-slate-100 shadow-sm cursor-pointer',
              error && 'border-rose-500 focus-visible:ring-rose-500 dark:border-rose-500',
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
