import React from 'react'
import { Calendar, ShieldCheck, ChevronRight, Stethoscope, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { SeverityBadge } from '../common/SeverityBadge'
import { AssessmentRecord, TriageSeverity } from '../../types'
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
  const triage = (assessment.triageLevel || assessment.triage_level || 'non-urgent') as TriageSeverity
  const score = assessment.consensusScore ?? assessment.consensus_score ?? 98.4
  const summary = assessment.aiSummary || assessment.ai_summary || ''
  const created = assessment.createdAt || assessment.created_at || 'Recent'
  const status = (assessment.status || 'resolved').toLowerCase()

  const getStatusBadge = () => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Resolved</span>
          </span>
        )
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
            <AlertTriangle className="h-3 w-3" />
            <span>Active</span>
          </span>
        )
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold">
            <ArrowUpRight className="h-3 w-3" />
            <span>Escalated</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            <span className="capitalize">{status}</span>
          </span>
        )
    }
  }

  return (
    <Card
      className={cn(
        'group hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        className
      )}
      onClick={() => onViewDetails?.(assessment)}
    >
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0 mt-0.5 group-hover:scale-105 transition-transform border border-emerald-100 dark:border-emerald-900/40">
            <Stethoscope className="h-5 w-5" />
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            {/* Metadata badges: ID, Severity, Status, Date */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {assessment.id}
              </span>
              <SeverityBadge severity={triage} size="sm" />
              {getStatusBadge()}
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>{created}</span>
              </span>
            </div>

            {/* Complaint Section */}
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-0.5">
                Chief Complaint
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {assessment.symptoms}
              </h4>
            </div>

            {summary && (
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {summary}
              </p>
            )}

            {assessment.differentialDiagnoses && assessment.differentialDiagnoses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {assessment.differentialDiagnoses.map((diag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60"
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

        {/* Right side Consensus Score & Action */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 gap-2 shrink-0 md:min-w-[130px]">
          <div className="text-left md:text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Consensus Score
            </div>
            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center md:justify-end gap-1">
              <ShieldCheck className="h-4 w-4" />
              <span>{score.toFixed(1)}%</span>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform"
          >
            <span>View Full Report</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
