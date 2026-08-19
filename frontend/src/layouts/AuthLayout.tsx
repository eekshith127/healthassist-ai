import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { HeartPulse, ShieldCheck, Activity, Users } from 'lucide-react'
import { HealthStatusBadge } from '../components/common/HealthStatusBadge'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Left Branding Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 backdrop-blur-md rounded-xl border border-emerald-400/30">
              <HeartPulse className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="font-bold text-xl tracking-tight">HealthAssist</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/20 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Clinical Grade AI Telemedicine
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Personalized health awareness backed by multi-LLM consensus.
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Experience real-time clinical triage, unified electronic health profiles, emergency digital health cards, and direct healthcare provider connectivity.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Instant Triage</div>
                <div className="text-slate-400">Under 60 seconds</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Tele-Providers</div>
                <div className="text-slate-400">Verified Network</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <div>© {new Date().getFullYear()} HealthAssist Systems</div>
          <HealthStatusBadge />
        </div>
      </div>

      {/* Right Form Outlet */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-md">
          <div className="md:hidden flex justify-center mb-8">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-emerald-600">
              <HeartPulse className="h-6 w-6" />
              <span>HealthAssist</span>
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
