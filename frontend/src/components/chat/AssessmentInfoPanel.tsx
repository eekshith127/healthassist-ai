import React from 'react'
import {
  Activity,
  ShieldCheck,
  User,
  HeartPulse,
  Stethoscope,
  Info,
  X,
} from 'lucide-react'
import { AssessmentRecord, HealthProfileData } from '../../types'
import { cn } from '../../utils/cn'

export interface AssessmentInfoPanelProps {
  assessment?: Partial<AssessmentRecord> | null
  healthProfile?: HealthProfileData | null
  isOpen: boolean
  onClose?: () => void
  className?: string
}

export const AssessmentInfoPanel: React.FC<AssessmentInfoPanelProps> = ({
  assessment,
  healthProfile,
  isOpen,
  onClose,
  className,
}) => {
  if (!isOpen) return null

  const triage = assessment?.triageLevel || assessment?.triage_level || 'non-urgent'
  const consensusScore = assessment?.consensusScore || assessment?.consensus_score || 0
  const modelAgreement = assessment?.modelAgreement || assessment?.model_agreement || '3/3'

  const formatList = (val: any): string => {
    if (!val) return 'None recorded'
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'None recorded'
    return String(val)
  }

  return (
    <div
      className={cn(
        'w-72 shrink-0 flex flex-col bg-white border-l border-[#E5E7EB] lg:rounded-xl p-3.5 shadow-subtle space-y-3.5 overflow-y-auto max-h-[calc(100vh-6.5rem)] custom-scrollbar text-xs',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <div>
          <h3 className="text-xs font-semibold text-[#111827] uppercase tracking-wider">
            Clinical context
          </h3>
          <p className="text-[10px] text-[#6B7280]">Live session overview</p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280]"
            title="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Active Assessment Badge */}
      <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280] text-[11px]">Session ID</span>
          <span className="font-mono text-[11px] font-medium text-[#111827]">
            {assessment?.id ? (String(assessment.id).startsWith('HA-') ? assessment.id : `#${assessment.id}`) : 'Active session'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280] text-[11px]">Triage Level</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded font-medium',
              triage === 'emergency'
                ? 'bg-red-50 text-[#DC2626]'
                : triage === 'urgent'
                ? 'bg-amber-50 text-[#D97706]'
                : 'bg-emerald-50 text-[#16A34A]'
            )}
          >
            {triage}
          </span>
        </div>

        {consensusScore > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B7280] text-[11px]">Consensus score</span>
            <span className="text-xs font-semibold text-[#2563EB]">
              {Number(consensusScore).toFixed(0)}/100
            </span>
          </div>
        )}
      </div>

      {/* EHR Patient Baseline Context */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
          Patient baseline (EHR)
        </div>

        <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#6B7280] block text-[10px]">Age / Sex</span>
              <span className="font-medium text-[#111827]">
                {healthProfile?.age ? `${healthProfile.age} yrs` : '—'} / {healthProfile?.gender || healthProfile?.sex || '—'}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px]">Blood Type</span>
              <span className="font-medium text-[#111827]">
                {healthProfile?.blood_type || healthProfile?.blood_group || '—'}
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-[#E5E7EB]">
            <span className="text-[#6B7280] block text-[10px]">Allergies</span>
            <span className="text-[11px] font-medium text-[#111827]">
              {formatList(healthProfile?.allergies)}
            </span>
          </div>

          {healthProfile?.chronic_conditions && (
            <div className="pt-1.5 border-t border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[10px]">Chronic Conditions</span>
              <span className="text-[11px] font-medium text-[#111827]">
                {formatList(healthProfile.chronic_conditions)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Reported Symptoms Breakdown */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
          Intake findings
        </div>

        <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] space-y-2 text-xs">
          <div>
            <span className="text-[#6B7280] block text-[10px]">Primary Complaint</span>
            <p className="text-[11px] font-medium text-[#111827] line-clamp-3">
              {assessment?.symptoms || 'Awaiting symptom input...'}
            </p>
          </div>

          {assessment?.aiSummary && (
            <div className="pt-1.5 border-t border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[10px]">Clinical Summary</span>
              <p className="text-[11px] text-[#4B5563] leading-snug">
                {assessment.aiSummary}
              </p>
            </div>
          )}

          {assessment?.recommendedSpecialist && (
            <div className="pt-1.5 border-t border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[10px]">Recommended Specialty</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-[#2563EB] font-medium text-[11px]">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>{assessment.recommendedSpecialist}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Medical Safety Disclaimer */}
      <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[10px] text-[#6B7280] leading-snug">
        This tool provides AI-assisted health awareness and does not constitute a medical diagnosis.
      </div>
    </div>
  )
}
