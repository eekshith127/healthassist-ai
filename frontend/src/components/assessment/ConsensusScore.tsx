import React from 'react'
import { ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface ConsensusScoreProps {
  score: number
  agreementLevel?: string
  modelsCount?: number
  modelAgreementText?: string
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
  agreementLevel,
  modelsCount = 3,
  modelAgreementText,
  modelVotes,
  modelNames,
  showBreakdown = true,
  className,
}) => {
  const m1Score = modelVotes?.model1 ?? modelVotes?.geminiMed ?? 88.0
  const m2Score = modelVotes?.model2 ?? modelVotes?.medPalm ?? 92.0
  const m3Score = modelVotes?.model3 ?? modelVotes?.clinicalGpt ?? 88.0

  const m1Label = modelNames?.model1 ?? 'Llama 3.1 8B'
  const m2Label = modelNames?.model2 ?? 'Gemini Flash'
  const m3Label = modelNames?.model3 ?? 'Nemotron 30B'

  return (
    <div
      className={cn(
        'rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-[#111827] uppercase tracking-wider">
            Consensus score
          </div>
          <div className="text-[12px] text-[#6B7280]">
            {modelAgreementText || `${agreementLevel || `${modelsCount}/${modelsCount}`} models agree`}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-semibold text-[#2563EB] tracking-tight">
            {score.toFixed(0)}/100
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#2563EB] transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>

      {/* Models Breakdown */}
      {showBreakdown && (
        <div className="pt-2 border-t border-[#E5E7EB] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="text-[11px] text-[#6B7280] truncate">
              {m1Label}
            </div>
            <div className="text-xs font-semibold text-[#111827] mt-0.5">
              {m1Score.toFixed(0)}%
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="text-[11px] text-[#6B7280] truncate">
              {m2Label}
            </div>
            <div className="text-xs font-semibold text-[#111827] mt-0.5">
              {m2Score.toFixed(0)}%
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="text-[11px] text-[#6B7280] truncate">
              {m3Label}
            </div>
            <div className="text-xs font-semibold text-[#111827] mt-0.5">
              {m3Score.toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
