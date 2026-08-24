import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Activity } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F9FAFB] font-sans antialiased text-[#111827]">
      {/* LEFT COLUMN: PRODUCT IDENTITY & INTRODUCTION (~50% DESKTOP) */}
      <div className="w-full md:w-1/2 bg-[#0F172A] text-slate-100 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-[#1E293B] overflow-hidden">
        {/* TOP: Brand Logo */}
        <div className="relative z-10">
          <Link to="/dashboard" className="inline-flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity">
            <div className="p-1.5 bg-[#2563EB] rounded-lg text-white">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1">
              <span>TRISHUL</span>
              <span className="text-[#60A5FA]">AI</span>
            </span>
          </Link>
        </div>

        {/* MIDDLE: Product Statement & 3 Numbered Capabilities */}
        <div className="relative z-10 my-8 sm:my-12 lg:my-16 space-y-8 max-w-lg">
          {/* Eyebrow + Main Headline + Description */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#60A5FA]">
              Clinical Intelligence Protocol
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-[1.2]">
              Clinical AI with tri-model consensus and triage.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-1">
              TRISHUL AI coordinates three independent medical AI models (Llama 3.1, Gemini Flash, and Nemotron 30B) through an AI Judge consensus protocol to deliver clinical symptom awareness and structured triage.
            </p>
          </div>

          {/* Clean Understated Vertical Benefits List */}
          <div className="hidden sm:flex flex-col space-y-4 pt-4 border-t border-[#1E293B]">
            {/* Benefit 01 */}
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-semibold text-[#60A5FA] mt-0.5 select-none shrink-0">
                01
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Dynamic Conversational Intake
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Symptom-tailored intake probing without repetitive scripts, gathering duration, severity, and red flags.
                </p>
              </div>
            </div>

            {/* Benefit 02 */}
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-semibold text-[#60A5FA] mt-0.5 select-none shrink-0">
                02
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Tri-Model Clinical Consensus
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Llama 3.1, Gemini Flash, and Nemotron 30B evaluate cases concurrently for diagnostic reliability.
                </p>
              </div>
            </div>

            {/* Benefit 03 */}
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-semibold text-[#60A5FA] mt-0.5 select-none shrink-0">
                03
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Model Transparency & Safety Controls
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Inspect individual model reasoning alongside automated emergency red flag overrides.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Quiet Footer / Disclaimer */}
        <div className="relative z-10 text-[11px] text-slate-400 space-y-1 pt-4 border-t border-[#1E293B]">
          <div>© {new Date().getFullYear()} TRISHUL AI. All rights reserved.</div>
          <div className="text-slate-500">
            For clinical health awareness. Does not replace professional medical diagnosis.
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AUTHENTICATION (~50% DESKTOP) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 bg-[#F9FAFB]">
        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
