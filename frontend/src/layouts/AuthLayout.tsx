import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fafafa] dark:bg-slate-950 font-sans antialiased selection:bg-emerald-800 selection:text-white">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: PRODUCT IDENTITY & INTRODUCTION (~50% DESKTOP) */}
      {/* ========================================================================= */}
      <div className="w-full md:w-1/2 bg-[#0b1f1c] text-slate-100 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-[#14352f] overflow-hidden">
        {/* Subtle, faint background grid/waveform line (almost invisible) */}
        <div className="absolute right-0 bottom-0 w-96 h-96 pointer-events-none opacity-[0.04] text-white overflow-hidden">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="0.75">
            <line x1="0" y1="40" x2="200" y2="40" />
            <line x1="0" y1="80" x2="200" y2="80" />
            <line x1="0" y1="120" x2="200" y2="120" />
            <line x1="0" y1="160" x2="200" y2="160" />
            <line x1="40" y1="0" x2="40" y2="200" />
            <line x1="80" y1="0" x2="80" y2="200" />
            <line x1="120" y1="0" x2="120" y2="200" />
            <line x1="160" y1="0" x2="160" y2="200" />
            <path d="M 0 100 Q 30 70 60 100 T 120 100 T 180 100 T 200 100" strokeWidth="1.2" />
          </svg>
        </div>

        {/* TOP: Restrained Brand Logo */}
        <div className="relative z-10">
          <Link to="/dashboard" className="inline-flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity">
            <div className="p-1.5 bg-[#14352f] rounded-lg border border-[#1e4b43] text-emerald-400">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">HealthAssist</span>
          </Link>
        </div>

        {/* MIDDLE: Product Statement & 3 Numbered Capabilities */}
        <div className="relative z-10 my-8 sm:my-12 lg:my-16 space-y-8 max-w-lg">
          {/* Eyebrow + Main Headline + Description */}
          <div className="space-y-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-emerald-400/90">
              AI-assisted health awareness
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold text-white tracking-tight leading-[1.18]">
              Understand your symptoms.<br />
              <span className="text-slate-200">Make a more informed next step.</span>
            </h1>

            <p className="text-slate-300 text-[15px] sm:text-base leading-relaxed pt-1">
              HealthAssist helps you organize your health information, understand your symptoms through a conversational AI assessment, and connect with appropriate healthcare providers.
            </p>
          </div>

          {/* Clean, Understated Vertical Benefits List (Desktop & Tablet) */}
          <div className="hidden sm:flex flex-col space-y-4 pt-4 border-t border-[#173d36]">
            {/* Benefit 01 */}
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-semibold text-emerald-400/80 mt-0.5 select-none shrink-0">
                01
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Personalized health context
                </h3>
                <p className="text-xs text-slate-300/85 leading-relaxed mt-0.5">
                  Your basic health information stays available for relevant future assessments.
                </p>
              </div>
            </div>

            {/* Benefit 02 */}
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-semibold text-emerald-400/80 mt-0.5 select-none shrink-0">
                02
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Multi-model assessment
                </h3>
                <p className="text-xs text-slate-300/85 leading-relaxed mt-0.5">
                  Multiple AI models independently assess the same structured symptom information.
                </p>
              </div>
            </div>

            {/* Benefit 03 */}
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-semibold text-emerald-400/80 mt-0.5 select-none shrink-0">
                03
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Healthcare connection
                </h3>
                <p className="text-xs text-slate-300/85 leading-relaxed mt-0.5">
                  Find relevant healthcare providers after completing an assessment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Quiet Footer / Disclaimer */}
        <div className="relative z-10 text-[11px] text-slate-400 space-y-1 pt-4 border-t border-[#173d36]/50">
          <div>© {new Date().getFullYear()} HealthAssist. All rights reserved.</div>
          <div className="text-slate-400/80">
            HealthAssist is designed for informational health awareness and is not a substitute for professional clinical diagnosis.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: AUTHENTICATION (~50% DESKTOP) */}
      {/* ========================================================================= */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 bg-[#fafafa] dark:bg-slate-950">
        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
