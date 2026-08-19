import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  CreditCard,
  HeartPulse,
  QrCode,
  Share2,
  Download,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react'

export const HealthCard: React.FC = () => {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            <span>Digital Emergency Health Card</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Instant scannable medical summary for first responders, emergency physicians, and telehealth intake.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share URL'}</span>
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span>Export Wallet PDF</span>
          </Button>
        </div>
      </div>

      {/* Main Digital Card Preview */}
      <div className="relative mx-auto w-full max-w-xl rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 p-6 md:p-8 text-white shadow-2xl border border-emerald-500/30 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

        {/* Card Top Header */}
        <div className="flex items-start justify-between border-b border-emerald-500/30 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <HeartPulse className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                EMERGENCY MEDICAL ID
              </div>
              <div className="text-xl font-extrabold tracking-tight">John Doe</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-emerald-300/80 font-mono">ID: HA-8492-MED</div>
            <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              <ShieldCheck className="h-3 w-3" />
              <span>VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Card Body Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs mb-6">
          <div className="space-y-0.5">
            <div className="text-[10px] text-emerald-200/70 font-semibold uppercase">Blood Type</div>
            <div className="text-base font-extrabold text-white">O-Positive (O+)</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-emerald-200/70 font-semibold uppercase">Age & Gender</div>
            <div className="text-sm font-bold text-white">32 yrs • Male</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-emerald-200/70 font-semibold uppercase">Organ Donor</div>
            <div className="text-sm font-bold text-emerald-300">Registered Yes</div>
          </div>

          <div className="col-span-2 md:col-span-2 space-y-0.5">
            <div className="text-[10px] text-rose-300 font-semibold uppercase flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Critical Allergies</span>
            </div>
            <div className="text-xs font-semibold text-white bg-rose-950/60 border border-rose-800/60 rounded px-2 py-1 w-fit">
              Penicillin, Peanuts (Severe Anaphylaxis)
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-emerald-200/70 font-semibold uppercase">Primary Hospital</div>
            <div className="text-xs font-medium text-slate-200 truncate">Memorial Tele-Care</div>
          </div>
        </div>

        {/* Card Bottom QR & Emergency Contact */}
        <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20 bg-black/20 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8">
          <div className="space-y-1">
            <div className="text-[10px] text-emerald-200/70 font-semibold uppercase">
              Emergency Contact (24/7)
            </div>
            <div className="text-sm font-bold text-white">Sarah Doe (Spouse)</div>
            <div className="text-xs font-mono text-emerald-300">+1 (555) 948-2940</div>
          </div>

          <div className="p-2 bg-white rounded-xl shadow-lg">
            <QrCode className="h-12 w-12 text-slate-950" />
          </div>
        </div>
      </div>

      {/* Safety instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How to use your Digital Health Card</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-500 space-y-2 leading-relaxed">
          <p>
            • Scan the QR code with any mobile camera during emergency intake to securely open an EMT-friendly snapshot of your vital conditions.
          </p>
          <p>
            • Add this card to Apple Wallet or Google Wallet using the export option above.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
