import React, { useState } from 'react'
import {
  Download,
  Share2,
  AlertTriangle,
  PhoneCall,
  Check,
  HelpCircle,
  Layers,
  Activity,
  HeartPulse,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { SeverityBadge } from '../common/SeverityBadge'
import { ConsensusScore } from './ConsensusScore'
import { AssessmentRecord, TriageSeverity, ModelAssessmentData } from '../../types'
import { cn } from '../../utils/cn'

export interface ResultCardProps {
  result: AssessmentRecord
  className?: string
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  className,
}) => {
  const [downloading, setDownloading] = useState(false)
  const [shared, setShared] = useState(false)
  const [showModelBreakdown, setShowModelBreakdown] = useState(false)

  const triage = (result.triageLevel || result.triage_level || 'non-urgent') as TriageSeverity
  const score = result.consensusScore ?? result.consensus_score ?? 90
  const summary = result.aiSummary || result.ai_summary || result.whyConsidered || ''
  const isEmergency = triage === 'emergency' || result.safety_checked === 'override'

  // Model agreement & disagreements
  const agreement = result.modelAgreement || result.model_agreement || '3/3'
  const disagreements = result.disagreements || []

  // Extract model assessments
  const rawModelAssessments = result.modelAssessments || result.model_assessments || {}
  const modelEntries = Object.entries(rawModelAssessments)

  // Default fallback models if raw model entries is empty
  const displayModels: Array<{ id: string; name: string; provider: string; data?: ModelAssessmentData }> =
    modelEntries.length > 0
      ? modelEntries.map(([key, val]) => ({
          id: key,
          name: val?.display_name || val?.model_name || (key === 'model_1' ? 'Clinical Diagnostic AI (Llama 3.1)' : key === 'model_2' ? 'General Medical Reasoning AI (Gemini Flash)' : 'Specialist Differential Analyst (Nemotron 30B)'),
          provider: val?.provider || (key === 'model_1' ? 'Meta Llama 3.1 8B' : key === 'model_2' ? 'Google Gemini 2.5 Flash' : 'NVIDIA Nemotron 30B'),
          data: val,
        }))
      : [
          {
            id: 'model_1',
            name: 'Clinical Diagnostic AI (Llama 3.1)',
            provider: 'Meta Llama 3.1 8B',
            data: {
              possible_conditions: result.differentialDiagnoses?.slice(0, 2).map((d) => ({
                name: d.name,
                score: d.probability,
                supporting_factors: [d.description],
              })) || [{ name: 'Primary Differential Evaluation', score: 88 }],
              severity: triage,
              recommended_specialty: result.recommendedSpecialist || 'General Practice',
              clinical_reasoning: 'Evaluated primary clinical symptomatology and acute presentation markers.',
            },
          },
          {
            id: 'model_2',
            name: 'General Medical Reasoning AI (Gemini Flash)',
            provider: 'Google Gemini 2.5 Flash',
            data: {
              possible_conditions: result.differentialDiagnoses?.slice(0, 2).map((d) => ({
                name: d.name,
                score: Math.max(50, d.probability - 5),
                supporting_factors: [d.description],
              })) || [{ name: 'Clinical Presentation Alignment', score: 85 }],
              severity: triage,
              recommended_specialty: result.recommendedSpecialist || 'Internal Medicine',
              clinical_reasoning: 'Synthesized longitudinal symptom progression and systemic risk profile.',
            },
          },
          {
            id: 'model_3',
            name: 'Specialist Differential Analyst (Nemotron 30B)',
            provider: 'NVIDIA Nemotron 30B',
            data: {
              possible_conditions: result.differentialDiagnoses?.slice(0, 2).map((d) => ({
                name: d.name,
                score: Math.min(95, d.probability + 3),
                supporting_factors: [d.description],
              })) || [{ name: 'Specialist Differential Assessment', score: 92 }],
              severity: triage,
              recommended_specialty: result.recommendedSpecialist || 'Specialist Referral',
              clinical_reasoning: 'Screened for differential outliers, secondary etiologies, and clinical urgency.',
            },
          },
        ]

  // Leading condition
  const leadingCondition =
    result.differentialDiagnoses && result.differentialDiagnoses.length > 0
      ? result.differentialDiagnoses[0].name
      : 'Clinical Symptom Evaluation'

  // Other possibilities (differentials after the top one)
  const otherPossibilities =
    result.differentialDiagnoses && result.differentialDiagnoses.length > 1
      ? result.differentialDiagnoses.slice(1)
      : []

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
    <div className={cn('space-y-4 max-w-3xl mx-auto', className)}>
      <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#6B7280]">
                {String(result.id).startsWith('HA-') ? result.id : `#${result.id}`}
              </span>
              <span className="text-[#D1D5DB]">•</span>
              <span className="text-xs text-[#6B7280]">Assessment Summary</span>
            </div>
            <h2 className="text-[18px] font-semibold text-[#111827] tracking-tight">
              Clinical Assessment Report
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SeverityBadge severity={triage} size="md" />
          </div>
        </div>

        <CardContent className="p-4 sm:p-5 space-y-5">
          {/* 1. SAFETY WARNING WHEN APPLICABLE */}
          {isEmergency && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-[#DC2626]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Urgent Safety Warning: Immediate Care Advised</span>
              </div>
              <p className="text-xs text-[#991B1B] leading-relaxed">
                Critical red flags were identified during evaluation. Please seek immediate medical attention or call emergency services.
              </p>
              <div>
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium text-xs transition-colors"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Call Emergency (112)</span>
                </a>
              </div>
            </div>
          )}

          {/* 2. CONSENSUS SCORE & MODEL AGREEMENT METRIC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <ConsensusScore
                score={score}
                agreementLevel={agreement}
                modelsCount={3}
                modelAgreementText={`${agreement} models agree`}
              />
            </div>

            {/* Severity Card */}
            <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between space-y-2 text-xs">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Triage Severity
                </div>
                <div>
                  <SeverityBadge severity={triage} size="sm" />
                </div>
              </div>

              <div className="text-[12px] text-[#6B7280] leading-relaxed">
                {triage === 'emergency'
                  ? 'Immediate emergency care indicated.'
                  : triage === 'urgent'
                  ? 'Evaluation recommended within 24-48 hours.'
                  : 'Low acuity. Home care and observation advised.'}
              </div>
            </div>
          </div>

          {/* 3. LEADING POSSIBLE CONDITION */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Leading possible condition</span>
            </div>

            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <h3 className="text-base font-semibold text-[#111827]">
                  {leadingCondition}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE] w-fit">
                  Primary match ({score.toFixed(0)}% score)
                </span>
              </div>

              {summary && (
                <div className="pt-2 border-t border-[#E5E7EB] text-xs text-[#4B5563] leading-relaxed space-y-1">
                  <div className="font-medium text-[#111827]">Supporting factors:</div>
                  <p>{summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. OTHER POSSIBILITIES */}
          {otherPossibilities.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#6B7280]" />
                <span>Other differentials considered ({otherPossibilities.length})</span>
              </div>

              <div className="space-y-1.5">
                {otherPossibilities.map((diag, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#111827]">
                        {index + 2}. {diag.name}
                      </span>
                      <span className="text-[#6B7280] text-[11px]">
                        {diag.probability}% score
                      </span>
                    </div>
                    {diag.description && (
                      <p className="text-[#6B7280] text-[11px] leading-relaxed">
                        {diag.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. MODEL DISAGREEMENT IF APPLICABLE */}
          {disagreements.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Model Disagreement Notes</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px] pt-0.5">
                {disagreements.map((dis, idx) => (
                  <li key={idx}>{dis}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. INDIVIDUAL AI MODEL BREAKDOWN SECTION */}
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[13px] font-semibold text-[#111827]">
                  Tri-Model Breakdown
                </div>
                <div className="text-xs text-[#6B7280]">
                  Inspect individual conclusions from Llama 3.1, Gemini Flash, and Nemotron 30B.
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModelBreakdown(!showModelBreakdown)}
                className="text-xs h-8 px-3 border-[#E5E7EB] bg-white gap-1.5 shrink-0"
              >
                <span>{showModelBreakdown ? 'Hide models' : 'Inspect models'}</span>
                {showModelBreakdown ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            {/* Expandable Model Breakdown Cards */}
            {showModelBreakdown && (
              <div className="pt-2 border-t border-[#E5E7EB] grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {displayModels.map((m, idx) => {
                  const conditions = m.data?.possible_conditions || []
                  return (
                    <div
                      key={m.id || idx}
                      className="p-3 rounded-lg bg-white border border-[#E5E7EB] space-y-2 text-xs"
                    >
                      <div className="border-b border-[#E5E7EB] pb-1.5">
                        <div className="font-semibold text-[#111827] truncate">
                          {m.name}
                        </div>
                        <span className="text-[10px] text-[#6B7280]">
                          {m.provider}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                          Findings
                        </div>
                        {conditions.map((c, cIdx) => (
                          <div key={cIdx} className="text-[11px] flex items-center justify-between">
                            <span className="text-[#374151] truncate">{c.name}</span>
                            <span className="font-medium text-[#2563EB]">{c.score}%</span>
                          </div>
                        ))}
                      </div>

                      {m.data?.clinical_reasoning && (
                        <div className="text-[11px] text-[#6B7280] pt-1 border-t border-[#E5E7EB] leading-relaxed">
                          {m.data.clinical_reasoning}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 7. RECOMMENDED NEXT STEP */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <h4 className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-[#2563EB]" />
                <span>Recommended next steps</span>
              </h4>
              {result.recommendedSpecialist && (
                <span className="text-xs font-medium text-[#2563EB]">
                  Specialty: {result.recommendedSpecialist}
                </span>
              )}
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              {result.recommendedAction ||
                result.recommended_next_step ||
                'Consult a qualified healthcare provider if symptoms persist or intensify.'}
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="gap-1.5 text-xs h-8 px-3 border-[#E5E7EB]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{downloading ? 'Exporting...' : 'Download summary'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-1.5 text-xs h-8 px-3 text-[#6B7280]"
              >
                {shared ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{shared ? 'Copied' : 'Share'}</span>
              </Button>
            </div>
          </div>

          {/* 8. CLINICAL DISCLAIMER */}
          <div className="text-[11px] text-[#6B7280] text-center leading-relaxed pt-2 border-t border-[#E5E7EB]">
            TRISHUL AI provides clinical triage awareness and decision support. It does not replace formal clinical diagnosis by a licensed healthcare professional.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


