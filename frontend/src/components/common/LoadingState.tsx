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
          'p-6 rounded-xl border border-[#E5E7EB] bg-white text-center space-y-3 shadow-subtle',
          className
        )}
      >
        <div className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] text-xs font-medium border border-[#DBEAFE]">
            <Sparkles className="h-3 w-3" />
            <span>Tri-Model Consensus Active</span>
          </div>
          <h4 className="text-sm font-semibold text-[#111827]">
            Evaluating clinical findings...
          </h4>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            Cross-referencing symptom markers across Llama 3.1 8B, Gemini Flash, and Nemotron 30B.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-[#6B7280]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-[#2563EB]" />
            Safety screener
          </span>
          <span>•</span>
          <span>Red flag filter</span>
          <span>•</span>
          <span>Consensus engine</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-2', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
      <div className="text-center">
        <p className="text-xs font-medium text-[#111827]">{message}</p>
        {subMessage && <p className="text-[11px] text-[#6B7280] mt-0.5">{subMessage}</p>}
      </div>
    </div>
  )
}
