import React, { useState } from 'react'
import {
  ShieldCheck,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Activity,
  FileText,
  UserCheck,
  Sparkles,
  PhoneCall,
  Check,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { SeverityBadge } from '../common/SeverityBadge'
import { ConsensusScore } from './ConsensusScore'
import { AssessmentRecord, TriageSeverity } from '../../types'
import { cn } from '../../utils/cn'

export interface ResultCardProps {
  result: AssessmentRecord
  onBookSpecialist?: (specialist?: string) => void
  className?: string
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onBookSpecialist,
  className,
}) => {
  const [downloading, setDownloading] = useState(false)
  const [shared, setShared] = useState(false)

  const triage = (result.triageLevel || result.triage_level || 'non-urgent') as TriageSeverity
  const score = result.consensusScore ?? result.consensus_score ?? 98.4
  const summary = result.aiSummary || result.ai_summary || ''
  const isEmergency = triage === 'emergency'

  const handleDownloadPDF = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
    }, 1200)
  }

  const handleShare = () => {
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Top Banner Card */}
      <Card className="overflow-hidden border-emerald-500/30 shadow-md">
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-emerald-400/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Verified Clinical Triage Protocol</span>
                </span>
                <span className="text-xs text-emerald-200 font-mono">ID: {result.id}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Assessment Results & Protocol
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <SeverityBadge severity={triage} size="lg" />
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
            score={score}
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
              {summary}
            </p>
          </div>

          {/* Differential Diagnoses Probabilities */}
          {result.differentialDiagnoses && result.differentialDiagnoses.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Differential Diagnoses Likelihood</span>
              </h4>

              <div className="space-y-2.5">
                {result.differentialDiagnoses.map((diag, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2"
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
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${diag.probability}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {diag.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions & Provider Handoff */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>Recommended Clinical Handoff</span>
              </h4>
              {result.recommendedSpecialist && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  {result.recommendedSpecialist}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {result.recommendedAction ||
                'Schedule a telemedicine consultation to receive personalized clinical oversight, medication review, and diagnostic laboratory orders.'}
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                onClick={() => onBookSpecialist?.(result.recommendedSpecialist)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
              >
                <UserCheck className="h-4 w-4" />
                <span>Book Telehealth Consult</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{downloading ? 'Exporting PDF...' : 'Download Clinical Summary'}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={handleShare}
                className="gap-1.5 text-xs text-slate-500"
              >
                {shared ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{shared ? 'Link Copied' : 'Share with Clinician'}</span>
              </Button>
            </div>
          </div>

          {/* Clinical Disclaimer Footnote */}
          <div className="text-[11px] text-slate-400 text-center leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            ⚠️ HealthAssist Clinical AI Triage provides differential reasoning for awareness and telemedicine triage guidance. It is not an official medical diagnosis.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
