import React from 'react'
import { Activity, ShieldCheck, Sparkles, HeartPulse, Stethoscope, CheckCircle2 } from 'lucide-react'

export interface AuthVisualPanelProps {
  mode?: 'login' | 'signup'
}

export const AuthVisualPanel: React.FC<AuthVisualPanelProps> = ({ mode = 'login' }) => {
  return (
    <div className="relative h-full flex flex-col justify-between p-8 sm:p-10 lg:p-12 text-white bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB] overflow-hidden select-none">
      {/* Ambient background glows & subtle grid */}
      <div
        className="absolute -top-24 -left-24 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Decorative subtle medical grid lines */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"
        aria-hidden="true"
      />

      {/* 1. TOP BRAND HEADER */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
          <div className="h-6 w-6 rounded-lg bg-white text-[#2563EB] flex items-center justify-center shadow-xs">
            <Activity className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
            <span>TRISHUL</span>
            <span className="text-blue-200">AI</span>
            <span className="text-[10px] font-normal text-blue-200/80 ml-1 pl-1.5 border-l border-white/20">
              Clinical Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE CONTENT & CLINICAL AI INTELLIGENCE VISUAL */}
      <div className="relative z-10 my-auto py-8 space-y-7 max-w-lg">
        {/* Headlines */}
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-medium">
            <Sparkles className="h-3 w-3" />
            <span>Tri-Model Consensus Engine</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-[1.25]">
            {mode === 'signup'
              ? 'Personalized healthcare AI, built on clinical consensus.'
              : 'Intelligent clinical care, always within reach.'}
          </h2>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-md">
            TRISHUL AI synthesizes three independent medical models (Llama 3.1, Gemini Flash, and Nemotron 30B) through an AI Judge consensus protocol to deliver safe symptom awareness and structured triage.
          </p>
        </div>

        {/* Clinical Intelligence Interactive Visual Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-4 shadow-lg">
          {/* Animated ECG Waveform Graphic */}
          <div className="relative h-14 w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/15 border border-white/10 px-3">
            <svg
              className="w-full h-10 text-emerald-300 stroke-current"
              viewBox="0 0 500 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 0,25 L 120,25 L 135,10 L 145,40 L 155,5 L 165,45 L 175,25 L 290,25 L 305,10 L 315,40 L 325,5 L 335,45 L 345,25 L 500,25"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-[ecgPulse_3s_ease-in-out_infinite]"
              />
            </svg>
            <div className="absolute right-3 top-2 flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE TRIAGE</span>
            </div>
          </div>

          {/* 3 Connected Clinical Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
              <div className="font-semibold text-white">98.4%</div>
              <div className="text-[10px] text-blue-200 truncate">Consensus</div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
              <div className="font-semibold text-white">3 Models</div>
              <div className="text-[10px] text-blue-200 truncate">Concurrent</div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
              <div className="font-semibold text-white">112 Dispatch</div>
              <div className="text-[10px] text-blue-200 truncate">India Ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM COMPLIANCE & DISCLAIMER */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-white/15 text-[11px] text-blue-200/80">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
          <span>HL7 FHIR & HIPAA standards aligned</span>
        </div>
        <div className="text-[10px] text-blue-200/60">
          For health awareness & triage
        </div>
      </div>
    </div>
  )
}
