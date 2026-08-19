import React from 'react'
import { Clock, ShieldCheck, ChevronRight, Stethoscope } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { SeverityBadge } from '../common/SeverityBadge'
import { AssessmentRecord } from '../../types'
import { cn } from '../../utils/cn'

export interface AssessmentCardProps {
  assessment: AssessmentRecord
  onViewDetails?: (assessment: AssessmentRecord) => void
  className?: string
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  onViewDetails,
  className,
}) => {
  return (
    <Card
      className={cn(
        'group hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden',
        className
      )}
      onClick={() => onViewDetails?.(assessment)}
    >
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
            <Stethoscope className="h-5 w-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {assessment.id}
              </span>
              <SeverityBadge severity={assessment.triageLevel} size="sm" />
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {assessment.createdAt}
              </span>
            </div>

            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">
              {assessment.symptoms}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {assessment.aiSummary}
            </p>

            {assessment.differentialDiagnoses && assessment.differentialDiagnoses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {assessment.differentialDiagnoses.map((diag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <span>{diag.name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {diag.probability}%
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side stats & CTA */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 gap-2 shrink-0">
          <div className="text-left md:text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Consensus
            </div>
            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{assessment.consensusScore.toFixed(1)}%</span>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform"
          >
            <span>Review Full Report</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
