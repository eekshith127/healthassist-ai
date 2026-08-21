import React from 'react'
import { Loader2, ShieldCheck, Stethoscope, Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'triage-evaluating'
  message?: string
  subMessage?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  message = 'Loading medical records...',
  subMessage = 'Connecting securely to HealthAssist HIPAA node',
  className,
}) => {
  if (type === 'skeleton') {
    return (
      <div className={cn('space-y-4 w-full animate-pulse', className)}>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    )
  }

  if (type === 'triage-evaluating') {
    return (
      <div
        className={cn(
          'p-6 md:p-8 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 text-center space-y-4 shadow-sm',
          className
        )}
      >
        <div className="relative mx-auto flex items-center justify-center h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
          <div className="relative h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-inner">
            <Stethoscope className="h-7 w-7 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Multi-LLM Protocol Active</span>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Evaluating Clinical Symptoms...
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cross-referencing symptom clusters across Gemini Med, Med-PaLM, and emergency safety guidelines.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Safety Guard
          </span>
          <span>•</span>
          <span>Red Flag Screener</span>
          <span>•</span>
          <span>Consensus Engine</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-3', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{message}</p>
        {subMessage && <p className="text-xs text-slate-400 mt-0.5">{subMessage}</p>}
      </div>
    </div>
  )
}
