import React from 'react'
import { AlertTriangle, RotateCcw, PhoneCall, ShieldAlert } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  isEmergency?: boolean
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Complete Request',
  message = 'An unexpected error occurred while processing health data. Please try again.',
  onRetry,
  isEmergency = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border p-6 md:p-8 text-center space-y-4 shadow-sm',
        isEmergency
          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
        className
      )}
    >
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
        {isEmergency ? <ShieldAlert className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
      </div>

      {isEmergency && (
        <div className="p-3 rounded-xl bg-rose-100/70 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 font-medium">
          <p className="font-bold flex items-center justify-center gap-1.5 mb-1">
            <PhoneCall className="h-4 w-4" /> Immediate Medical Emergency Notice
          </p>
          If you are experiencing severe chest pain, shortness of breath, sudden numbness, or heavy bleeding, call 112 or visit your nearest Emergency Department immediately.
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="gap-2 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
        )}
        {isEmergency && (
          <a href="tel:112">
            <Button variant="destructive" size="sm" className="gap-2 text-xs font-bold">
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Call Emergency (112)</span>
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
