import React, { useState } from 'react'
import {
  ShieldCheck,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  FileText,
  Activity,
  PhoneCall,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Button } from '../ui/button'
import { SeverityBadge } from '../common/SeverityBadge'
import { ConsensusScore } from './ConsensusScore'
import { AssessmentRecord } from '../../types'
import { cn } from '../../utils/cn'

export interface ResultCardProps {
  result: AssessmentRecord
  onBookSpecialist?: (specialty?: string) => void
  className?: string
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onBookSpecialist,
  className,
}) => {
  const [downloaded, setDownloaded] = useState(false)
  const isEmergency = result.triageLevel === 'emergency'

  const handleDownload = () => {
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Card className="overflow-hidden border-2 border-emerald-600/30 dark:border-emerald-500/30 shadow-xl bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
                  FINAL CLINICAL TRIAGE SYNTHESIS
                </span>
                <span className="text-xs text-emerald-200 font-mono">ID: {result.id}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Assessment Results & Protocol
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <SeverityBadge severity={result.triageLevel} size="lg" />
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Emergency Alert Banner if Emergency */}
          {isEmergency && (
            <div className="p-4 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-sm">Emergency Medical Attention Advised</h5>
                <p>
                  Based on reported symptoms and clinical consensus, immediate in-person emergency evaluation is recommended.
                </p>
                <div className="pt-1">
                  <a href="tel:911">
                    <Button variant="destructive" size="sm" className="gap-1.5 font-bold">
                      <PhoneCall className="h-4 w-4" />
                      <span>Call 911 Immediately</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Consensus Score Block */}
          <ConsensusScore
            score={result.consensusScore}
            modelVotes={result.modelVotes}
            showBreakdown={true}
          />

          {/* Symptoms Evaluated */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reported Chief Complaint & Duration
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              "{result.symptoms}"
            </p>
            {result.duration && (
              <p className="text-xs text-slate-500">
                Duration: <span className="font-semibold text-slate-700 dark:text-slate-300">{result.duration}</span>
                {result.reportedPainScale !== undefined && (
                  <span> • Pain Intensity: <span className="font-semibold text-slate-700 dark:text-slate-300">{result.reportedPainScale}/10</span></span>
                )}
              </p>
            )}
          </div>

          {/* AI Clinical Synthesis */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span>Consensus Clinical Summary</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              {result.aiSummary}
            </p>
          </div>

          {/* Differential Diagnoses Probabilities */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Differential Diagnoses Likelihood</span>
            </h4>

            <div className="space-y-2.5">
              {result.differentialDiagnoses.map((diag, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {index + 1}. {diag.name}
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {diag.probability}% probability
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${diag.probability}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {diag.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Red Flag Checklist & Self-Care Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Safety Exclusions */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Screened Red Flags</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {result.emergencyRedFlags?.map((flag, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{flag}</span>
                  </li>
                )) || (
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>No acute life-threatening markers identified</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Self-Care Instructions */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>Recommended Action Plan</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {result.selfCareAdvice?.map((advice, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <span>{advice}</span>
                  </li>
                )) || (
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <span>{result.recommendedAction}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>

        {/* Footer Actions */}
        <CardFooter className="p-6 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>
              Recommended Care Provider:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {result.recommendedSpecialist || 'Family Medicine'}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 text-xs"
            >
              {downloaded ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{downloaded ? 'PDF Downloaded' : 'Export PDF Report'}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => onBookSpecialist?.(result.recommendedSpecialist)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Telehealth Consult</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
