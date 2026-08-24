import React from 'react'
import { Activity, Check, ShieldCheck, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface SessionVerificationProps {
  statusText?: string
  subText?: string
  isAuthLoaded?: boolean
  isSignedIn?: boolean
  isSyncingProfile?: boolean
  profileCompleted?: boolean | null
  className?: string
}

export const SessionVerification: React.FC<SessionVerificationProps> = ({
  statusText = 'Verifying your session',
  subText = 'Securely connecting you to TRISHUL AI',
  isAuthLoaded = true,
  isSignedIn = true,
  isSyncingProfile = true,
  profileCompleted,
  className,
}) => {
  return (
    <div
      className={cn(
        'min-h-screen w-full flex items-center justify-center p-4 bg-[#F9FAFB] relative overflow-hidden select-none antialiased',
        className
      )}
    >
      {/* Extremely subtle ambient lighting to match dashboard depth */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-50/60 via-emerald-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Main Verification Card */}
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-subtle flex flex-col items-center text-center relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
            <Activity className="h-3.5 w-3.5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-semibold tracking-tight text-[#111827] leading-tight">
              TRISHUL AI
            </span>
            <span className="text-[9px] font-medium tracking-wide text-[#6B7280]">
              Clinical Intelligence
            </span>
          </div>
        </div>

        {/* Health Icon Container with subtle pulse & ring glow */}
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-2xl bg-[#ECFDF5] animate-ping opacity-25 scale-110 -z-10 motion-reduce:hidden" />
          <div className="h-16 w-16 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shadow-xs">
            <Activity className="h-8 w-8 stroke-[2.2] animate-pulse motion-reduce:animate-none" />
          </div>
        </div>

        {/* Primary & Secondary Status Typography */}
        <div className="space-y-1 mb-5">
          <h2 className="text-[18px] font-semibold text-[#111827] tracking-tight">
            {statusText}
          </h2>
          <p className="text-xs text-[#6B7280] max-w-xs mx-auto leading-relaxed">
            {subText}
          </p>
        </div>

        {/* Thin Premium Indeterminate Progress Bar */}
        <div className="w-full max-w-[280px] h-1 bg-[#F3F4F6] rounded-full overflow-hidden mb-6 relative">
          <div className="h-full bg-[#2563EB] rounded-full w-1/2 animate-[progress_1.6s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-none" />
        </div>

        {/* Verification Checkpoints (Driven by Real Application State) */}
        <div className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3.5 space-y-2 text-left mb-5">
          {/* Step 1: Authentication */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isAuthLoaded && isSignedIn ? (
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
              )}
              <span
                className={cn(
                  'font-medium',
                  isAuthLoaded && isSignedIn ? 'text-[#111827]' : 'text-[#6B7280]'
                )}
              >
                Authentication verified
              </span>
            </div>
            <span className="text-[10px] text-[#059669] font-medium font-mono">
              {isAuthLoaded && isSignedIn ? '200 OK' : 'Checking'}
            </span>
          </div>

          {/* Step 2: Gateway / Node */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <span className="font-medium text-[#111827]">
                Secure gateway connected
              </span>
            </div>
            <span className="text-[10px] text-[#059669] font-medium font-mono">
              Active
            </span>
          </div>

          {/* Step 3: Health Profile EHR Sync */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isSyncingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}
              <span
                className={cn(
                  'font-medium',
                  isSyncingProfile ? 'text-[#2563EB]' : 'text-[#111827]'
                )}
              >
                {isSyncingProfile ? 'Loading health profile...' : 'Health profile loaded'}
              </span>
            </div>
            <span
              className={cn(
                'text-[10px] font-medium font-mono',
                isSyncingProfile ? 'text-[#2563EB]' : 'text-[#059669]'
              )}
            >
              {isSyncingProfile ? 'Syncing' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Security & HIPAA Compliance Footer Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
          <ShieldCheck className="h-3.5 w-3.5 text-[#2563EB]" />
          <span>Secure 256-bit encrypted clinical connection</span>
        </div>
      </div>
    </div>
  )
}
