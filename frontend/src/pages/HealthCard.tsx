import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  PhoneCall,
  ShieldCheck,
  Copy,
  Check,
  Smartphone,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { HealthCard as HealthCardWidget } from '../components/health/HealthCard'
import { mockCurrentUser } from '../services/mockData'
import { fetchHealthProfile } from '../services/profileService'
import { HealthProfile } from '../types'

export const HealthCard: React.FC = () => {
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [walletAdded, setWalletAdded] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const p = await fetchHealthProfile()
        setProfile(p)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://healthassist.ai/med-id/${mockCurrentUser.patientId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddToWallet = () => {
    setWalletAdded(true)
    setTimeout(() => setWalletAdded(false), 3000)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            <span>Digital Emergency Health ID</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized electronic emergency health card for EMS, hospitals, and emergency telehealth intake.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs font-semibold">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy ID Link'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleAddToWallet}
            className="gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>{walletAdded ? 'Added to Apple Wallet' : 'Add to Apple / Google Wallet'}</span>
          </Button>
        </div>
      </div>

      {/* Main Interactive Digital ID Card */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center p-12">
            <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
          </div>
        ) : (
          <HealthCardWidget profile={profile} showActions={true} />
        )}
      </div>

      {/* Emergency Speed Dial & First Responder Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Emergency Speed Dial */}
        <Card className="border-rose-200/80 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-rose-800 dark:text-rose-300">
              <PhoneCall className="h-4 w-4 text-rose-600" />
              <span>Emergency Speed Dial & Hotlines</span>
            </CardTitle>
            <CardDescription>Direct hotlines accessible without device passcode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <a
              href="tel:911"
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <div className="font-bold text-rose-700 dark:text-rose-400">
                National Emergency Dispatch
              </div>
              <span className="font-mono font-bold text-rose-600 text-sm">911</span>
            </a>

            <a
              href="tel:18002221222"
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Poison Control Center
              </div>
              <span className="font-mono text-slate-600 dark:text-slate-400 text-xs">
                1-800-222-1222
              </span>
            </a>

            <a
              href="tel:+15552348910"
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Primary Emergency Contact (Emily Doe)
                </div>
                <div className="text-[10px] text-slate-400">Spouse</div>
              </div>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                +1 (555) 234-8910
              </span>
            </a>
          </CardContent>
        </Card>

        {/* First Responder Verification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>EMS & Clinician Verification</span>
            </CardTitle>
            <CardDescription>Standards compliant with HL7 FHIR and HIPAA emergency protocols</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              This digital health card complies with medical emergency identification standards. Scanning the QR code displays the patient's critical allergies, blood group, and verified medical conditions in read-only mode.
            </p>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300 font-medium">
              ✓ Verified Patient Hash: <span className="font-mono text-[10px]">0x8f4b...77e9 (SHA-256)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
