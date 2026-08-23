import React from 'react'
import { ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface ConsensusScoreProps {
  score: number
  modelVotes?: {
    geminiMed?: number
    medPalm?: number
    clinicalGpt?: number
    model1?: number
    model2?: number
    model3?: number
  }
  modelNames?: {
    model1?: string
    model2?: string
    model3?: string
  }
  showBreakdown?: boolean
  className?: string
}

export const ConsensusScore: React.FC<ConsensusScoreProps> = ({
  score,
  modelVotes,
  modelNames,
  showBreakdown = true,
  className,
}) => {
  const m1Score = modelVotes?.model1 ?? modelVotes?.geminiMed ?? 88.0
  const m2Score = modelVotes?.model2 ?? modelVotes?.medPalm ?? 92.0
  const m3Score = modelVotes?.model3 ?? modelVotes?.clinicalGpt ?? 88.0

  const m1Label = modelNames?.model1 ?? 'NVIDIA Llama'
  const m2Label = modelNames?.model2 ?? 'Google Gemini'
  const m3Label = modelNames?.model3 ?? 'NVIDIA Model 3'

  const getScoreColor = (val: number) => {
    if (val >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (val >= 80) return 'text-teal-600 dark:text-teal-400'
    if (val >= 70) return 'text-amber-600 dark:text-amber-400'
    return 'text-rose-600 dark:text-rose-400'
  }

  const getBarColor = (val: number) => {
    if (val >= 90) return 'bg-emerald-500'
    if (val >= 80) return 'bg-teal-500'
    if (val >= 70) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Clinical Consensus Agreement
            </div>
            <div className="text-[11px] text-slate-500">Multi-Model Cross-Verification</div>
          </div>
        </div>

        <div className="text-right">
          <div className={cn('text-xl font-extrabold tracking-tight', getScoreColor(score))}>
            {score.toFixed(0)}%
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            <span>Multi-LLM Verified</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-700 ease-out rounded-full', getBarColor(score))}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>

      {/* Models Breakdown */}
      {showBreakdown && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
              <Cpu className="h-3 w-3 text-emerald-500" />
              <span className="truncate">{m1Label}</span>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {m1Score.toFixed(0)}%
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
              <Cpu className="h-3 w-3 text-teal-500" />
              <span className="truncate">{m2Label}</span>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {m2Score.toFixed(0)}%
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
              <Cpu className="h-3 w-3 text-cyan-500" />
              <span className="truncate">{m3Label}</span>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {m3Score.toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
