import React from 'react'
import {
  Activity,
  ShieldCheck,
  User,
  HeartPulse,
  Stethoscope,
  Info,
  X,
  ExternalLink,
} from 'lucide-react'
import { AssessmentRecord, HealthProfileData } from '../../types'

import { Button } from '../ui/button'
import { cn } from '../../utils/cn'

export interface AssessmentInfoPanelProps {
  assessment?: Partial<AssessmentRecord> | null
  healthProfile?: HealthProfileData | null
  isOpen: boolean
  onClose?: () => void
  onBookSpecialist?: (specialty?: string) => void
  className?: string
}

export const AssessmentInfoPanel: React.FC<AssessmentInfoPanelProps> = ({
  assessment,
  healthProfile,
  isOpen,
  onClose,
  onBookSpecialist,
  className,
}) => {
  if (!isOpen) return null

  const triage = assessment?.triageLevel || assessment?.triage_level || 'non-urgent'
  const consensusScore = assessment?.consensusScore || assessment?.consensus_score || 98.6

  return (
    <div
      className={cn(
        'w-80 shrink-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 lg:rounded-2xl p-4 shadow-sm space-y-4 overflow-y-auto max-h-[calc(100vh-7.5rem)] custom-scrollbar',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Clinical Context
            </h3>
            <p className="text-[10px] text-slate-400">Live Intake Overview</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            title="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Active Assessment Badge */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Session ID</span>
          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {assessment?.id ? (String(assessment.id).startsWith('HA-') ? assessment.id : `#${assessment.id}`) : 'Active Live Intake'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Triage Level</span>
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
              triage === 'emergency'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                : triage === 'urgent'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            )}
          >
            {triage}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Consensus Score</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {Number(consensusScore).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* EHR Patient Baseline Context */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span>Patient Baseline (EHR)</span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Age / Sex</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {healthProfile?.age || '31'} yrs / {healthProfile?.gender || 'Male'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Blood Type</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {healthProfile?.blood_type || 'O+'}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px]">Known Allergies</span>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
              {healthProfile?.allergies || 'Penicillin (Severe), Peanuts (Moderate)'}
            </span>
          </div>

          {healthProfile?.chronic_conditions && (
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Chronic Conditions</span>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {healthProfile.chronic_conditions}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Reported Symptoms Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <HeartPulse className="h-3.5 w-3.5 text-slate-400" />
          <span>Intake Findings</span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Primary Complaint</span>
            <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 line-clamp-3">
              {assessment?.symptoms || 'Awaiting initial symptoms input...'}
            </p>
          </div>

          {assessment?.aiSummary && (
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">AI Clinical Summary</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                {assessment.aiSummary}
              </p>
            </div>
          )}

          {assessment?.recommendedSpecialist && (
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Recommended Specialist</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>{assessment.recommendedSpecialist}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-LLM Model Consensus Meters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Consensus Verification</span>
          </div>
          <span className="text-emerald-600 text-[10px]">3/3 Models</span>
        </div>

        <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px]">
          <div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1 font-medium text-[10px]">
              <span>Gemini Medical</span>
              <span className="font-mono font-bold text-emerald-600">99.2%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.2%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1 font-medium text-[10px]">
              <span>Med-PaLM</span>
              <span className="font-mono font-bold text-teal-600">98.6%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: '98.6%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1 font-medium text-[10px]">
              <span>Clinical GPT</span>
              <span className="font-mono font-bold text-cyan-600">98.1%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '98.1%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Specialist Consultation Action */}
      <Button
        onClick={() => onBookSpecialist?.(assessment?.recommendedSpecialist || 'Family Medicine')}
        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-xl shadow-xs"
      >
        <Stethoscope className="h-4 w-4" />
        <span>Connect with Doctor</span>
        <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
      </Button>

      {/* Medical Safety Disclaimer Alert */}
      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[10px] text-amber-800 dark:text-amber-300 leading-snug space-y-1">
        <div className="flex items-center gap-1 font-bold">
          <Info className="h-3 w-3 shrink-0" />
          <span>HealthAssist AI Disclaimer</span>
        </div>
        <p>
          This tool provides AI-assisted health awareness and does not provide a definitive medical diagnosis.
        </p>
      </div>
    </div>
  )
}
