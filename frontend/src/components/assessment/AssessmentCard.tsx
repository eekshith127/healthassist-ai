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
          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded bg-emerald-50 text-[#16A34A] text-[11px] font-medium border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Resolved</span>
          </span>
        )
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded bg-amber-50 text-[#D97706] text-[11px] font-medium border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Active</span>
          </span>
        )
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded bg-red-50 text-[#DC2626] text-[11px] font-medium border border-red-200">
            <ArrowUpRight className="h-3 w-3" />
            <span>Escalated</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded bg-[#F3F4F6] text-[#374151] text-[11px] font-medium border border-[#E5E7EB]">
            <CheckCircle2 className="h-3 w-3" />
            <span className="capitalize">{status}</span>
          </span>
        )
    }
  }

  const agreement = assessment.modelAgreement || assessment.model_agreement || '3/3'

  return (
    <Card
      className={cn(
        'group hover:border-[#D1D5DB] hover:bg-[#F9FAFB] transition-colors cursor-pointer overflow-hidden border border-[#E5E7EB] bg-white shadow-subtle rounded-xl',
        className
      )}
      onClick={() => onViewDetails?.(assessment)}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] shrink-0 mt-0.5">
            <Stethoscope className="h-4 w-4" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Metadata badges: ID, Severity, Model Agreement, Status, Date */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-medium text-[#6B7280]">
                {String(assessment.id).startsWith('HA-') ? assessment.id : `#${assessment.id}`}
              </span>
              <SeverityBadge severity={triage} size="sm" />
              <span className="px-2 py-0.2 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-medium border border-[#DBEAFE]">
                {agreement} models
              </span>
              {getStatusBadge()}
              <span className="text-xs text-[#D1D5DB]">•</span>
              <span className="text-xs text-[#6B7280] flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#9CA3AF]" />
                <span>{created}</span>
              </span>
            </div>

            {/* Complaint Section */}
            <div>
              <h4 className="font-semibold text-sm text-[#111827] leading-snug line-clamp-1 group-hover:text-[#2563EB] transition-colors">
                {assessment.symptoms}
              </h4>
            </div>

            {summary && (
              <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                {summary}
              </p>
            )}

            {assessment.differentialDiagnoses && assessment.differentialDiagnoses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {assessment.differentialDiagnoses.map((diag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F9FAFB] text-[11px] text-[#374151] font-medium border border-[#E5E7EB]"
                  >
                    <span>{diag.name}</span>
                    <span className="text-[#2563EB] font-semibold">
                      {diag.probability}%
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side Consensus Score & Action */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E7EB] gap-1.5 shrink-0 md:min-w-[120px]">
          <div className="text-left md:text-right">
            <div className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">
              Consensus
            </div>
            <div className="text-sm font-semibold text-[#2563EB] flex items-center md:justify-end gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{score.toFixed(0)}/100</span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB]">
            <span>View report</span>
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
