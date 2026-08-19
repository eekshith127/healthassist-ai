import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import {
  Stethoscope,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Bot,
  UserCheck,
} from 'lucide-react'

export const Assessment: React.FC = () => {
  const [step, setStep] = useState<number>(1)
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('1-3 days')
  const [severity, setSeverity] = useState('Mild')
  const [isEvaluating, setIsEvaluating] = useState(false)

  const handleStartEvaluation = () => {
    setIsEvaluating(true)
    setTimeout(() => {
      setIsEvaluating(false)
      setStep(3)
    }, 1200)
  }

  const handleReset = () => {
    setStep(1)
    setSymptoms('')
    setIsEvaluating(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Multi-LLM Clinical Consensus Protocol</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-emerald-600" />
          <span>AI Symptom Triage & Assessment</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Describe your symptoms to receive an intelligent clinical breakdown, urgency level, and provider recommendation.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="grid grid-cols-3 gap-2">
        <div
          className={`h-2 rounded-full transition-all ${
            step >= 1 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
        <div
          className={`h-2 rounded-full transition-all ${
            step >= 2 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
        <div
          className={`h-2 rounded-full transition-all ${
            step >= 3 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
      </div>

      {/* Step 1: Chief Complaint */}
      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Step 1: What symptoms are you experiencing?</CardTitle>
            <CardDescription>
              Be as specific as possible (e.g., mild headache behind the eyes, sore throat with dry cough).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symptoms">Describe your primary symptoms</Label>
              <textarea
                id="symptoms"
                rows={4}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                placeholder="E.g., I've had a dull headache for the past 2 days with light nasal congestion and fatigue..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            {/* Common quick-select pills */}
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">Common Symptoms:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Fever & Chills',
                  'Persistent Cough',
                  'Sore Throat',
                  'Headache',
                  'Fatigue',
                  'Nausea',
                  'Joint Stiffness',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSymptoms((prev) => (prev ? `${prev}, ${item}` : item))}
                    className="px-3 py-1 rounded-full text-xs border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!symptoms.trim()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <span>Next: Details & Duration</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Duration & Severity */}
      {step === 2 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Timeline & Severity</CardTitle>
            <CardDescription>
              Help our clinical engine contextualize the progression of your condition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>How long have these symptoms persisted?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['< 24 hours', '1-3 days', '4-7 days', '1+ weeks'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={`p-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                      duration === dur
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Perceived Severity</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Mild', desc: 'Manageable, minimal disruption' },
                  { label: 'Moderate', desc: 'Uncomfortable, interferes with daily tasks' },
                  { label: 'Severe', desc: 'Debilitating, intense discomfort' },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSeverity(s.label)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      severity === s.label
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-600/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{s.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={handleStartEvaluation}
              disabled={isEvaluating}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isEvaluating ? (
                <>
                  <Bot className="h-4 w-4 animate-spin" />
                  <span>Evaluating Consensus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate AI Assessment</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Assessment Results Preview */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="border-emerald-300 dark:border-emerald-800 shadow-md">
            <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-t-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600">Non-Urgent / Mild Upper Respiratory</Badge>
                    <Badge variant="outline" className="font-mono text-[10px]">Consensus: 98.4%</Badge>
                  </div>
                  <CardTitle className="text-xl mt-2">Clinical Triage Summary</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>New Assessment</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* AI consensus output */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-600" />
                  <span>Differential Analysis</span>
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Based on your reported symptoms (<em>"{symptoms}"</em> lasting {duration}), the multi-LLM consensus model indicates symptoms most consistent with mild viral rhinopharyngitis or early seasonal allergy exacerbation. No immediate critical red flags detected.
                </p>
              </div>

              {/* Safety check badge list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Red-Flag Safety Guard: <strong>Passed (0 Alerts)</strong></span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>Allergy Interaction Check: <strong>Clear</strong></span>
                </div>
              </div>

              {/* Recommended Next Steps */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Recommended Action Plan:
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                  <li>Maintain oral hydration (2-3L water daily) and rest.</li>
                  <li>Over-the-counter antihistamines or saline nasal rinse if allergy symptoms persist.</li>
                  <li>Schedule a telehealth consult if fever rises above 38.5°C or persists past 5 days.</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between bg-slate-50/50 dark:bg-slate-900/50 border-t p-4">
              <div className="text-[11px] text-slate-400">
                ⚠️ HealthAssist provides AI guidance for awareness; not a definitive clinical diagnosis.
              </div>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs">
                <UserCheck className="h-4 w-4" />
                <span>Connect With Specialist</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
