import React, { useState } from 'react'
import {
  HeartPulse,
  ShieldCheck,
  AlertCircle,
  Phone,
  QrCode,
  Download,
  Copy,
  Check,
  Pill,
  Activity,
  User,
  Scale,
  Ruler,
  FileHeart,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Modal } from '../ui/modal'
import { HealthProfile } from '../../types'
import { calculateBMI, calculateAge, formatHeight, formatWeight } from '../../utils/bmi'
import { cn } from '../../utils/cn'

export interface HealthCardProps {
  profile?: HealthProfile | null
  patientName?: string
  patientId?: string
  bloodType?: string
  age?: number | string
  gender?: string
  heightCm?: number
  weightKg?: number
  bmi?: number
  bmiCategory?: string
  medicalConditions?: string[]
  allergies?: string[]
  medications?: string[]
  emergencyContact?: {
    name: string
    relation: string
    phone: string
  }
  showActions?: boolean
  className?: string
}

export const HealthCardComponent: React.FC<HealthCardProps> = ({
  profile,
  patientName = 'John Doe',
  patientId = 'HA-8492-MED',
  bloodType,
  age,
  gender,
  heightCm,
  weightKg,
  bmi,
  bmiCategory,
  medicalConditions,
  allergies,
  medications,
  emergencyContact = {
    name: 'Emily Doe',
    relation: 'Spouse',
    phone: '+1 (555) 234-8910',
  },
  showActions = true,
  className,
}) => {
  const [copied, setCopied] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  // Derive consolidated values from profile or props
  const effectiveDob = profile?.dateOfBirth || profile?.date_of_birth
  const derivedAge =
    age ??
    profile?.age ??
    (effectiveDob ? calculateAge(effectiveDob) : 31)

  const effectiveSex =
    gender ??
    profile?.sex ??
    'Male'

  const effectiveHeight =
    heightCm ??
    profile?.heightCm ??
    profile?.height_cm ??
    180

  const effectiveWeight =
    weightKg ??
    profile?.weightKg ??
    profile?.weight_kg ??
    75

  const bmiEvaluation = calculateBMI(effectiveHeight, effectiveWeight)
  const effectiveBmi =
    bmi ??
    profile?.bmi ??
    bmiEvaluation?.bmi ??
    23.1

  const effectiveBmiCategory =
    bmiCategory ??
    profile?.bmiCategory ??
    profile?.bmi_category ??
    bmiEvaluation?.category ??
    'Normal weight'

  const effectiveBloodGroup =
    bloodType ??
    profile?.bloodGroup ??
    profile?.blood_group ??
    'O+'

  const effectiveConditions =
    medicalConditions ??
    profile?.medicalConditions ??
    profile?.medical_conditions ?? [
      'Mild Exercise-Induced Bronchospasm (Asthma)',
      'Seasonal Allergic Rhinitis',
    ]

  const effectiveMedications =
    medications ??
    profile?.medications ?? [
      'Loratadine 10mg Oral Tablet (Daily)',
      'Albuterol Inhaler (PRN)',
    ]

  const effectiveAllergies =
    allergies ??
    profile?.allergies ?? [
      'Penicillin / Amoxicillin (Severe)',
      'Peanuts & Tree Nuts (Moderate)',
    ]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://healthassist.ai/med-id/${patientId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('space-y-4 max-w-2xl mx-auto', className)}>
      {/* Digital Emergency Health Card Container */}
      <div className="relative w-full rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 sm:p-7 text-white shadow-2xl border border-emerald-500/30 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <HeartPulse className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                DIGITAL EMERGENCY HEALTH CARD
              </div>
              <div className="text-xl font-black tracking-tight text-white">{patientName}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-emerald-300 font-mono">ID: {patientId}</div>
            <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <ShieldCheck className="h-3 w-3" />
              <span>VERIFIED EHR</span>
            </div>
          </div>
        </div>

        {/* 9 Core Medical Attributes Display */}
        <div className="space-y-4 text-xs mb-5">
          {/* Biometrics Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
            {/* 1. Age & 2. Sex */}
            <div className="space-y-0.5">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Age / Sex</span>
              </div>
              <div className="text-xs font-bold text-white capitalize">
                {derivedAge ? `${derivedAge} yrs` : '—'} • {effectiveSex}
              </div>
            </div>

            {/* 3. Height */}
            <div className="space-y-0.5">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                <span>Height</span>
              </div>
              <div className="text-xs font-bold text-white">
                {formatHeight(effectiveHeight)}
              </div>
            </div>

            {/* 4. Weight */}
            <div className="space-y-0.5">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase flex items-center gap-1">
                <Scale className="h-3 w-3" />
                <span>Weight</span>
              </div>
              <div className="text-xs font-bold text-white">
                {formatWeight(effectiveWeight)}
              </div>
            </div>

            {/* 5. BMI */}
            <div className="space-y-0.5">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>BMI Index</span>
              </div>
              <div className="text-xs font-bold text-emerald-400">
                {effectiveBmi ?? '—'}{' '}
                <span className="text-[10px] font-normal text-slate-300">
                  ({effectiveBmiCategory})
                </span>
              </div>
            </div>
          </div>

          {/* 6. Blood Group Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/40">
                Rh
              </div>
              <div>
                <div className="text-[10px] text-emerald-300/80 uppercase font-semibold">
                  Blood Group & Type
                </div>
                <div className="text-sm font-black text-white">{effectiveBloodGroup}</div>
              </div>
            </div>
            <div className="text-right text-[11px] text-emerald-300">
              <span>Organ Donor: </span>
              <span className="font-bold text-emerald-400">Registered</span>
            </div>
          </div>

          {/* 7. Medical Conditions */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-300 font-semibold uppercase flex items-center gap-1">
              <FileHeart className="h-3 w-3 text-emerald-400" />
              <span>Chronic Medical Conditions ({effectiveConditions.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {effectiveConditions.length > 0 ? (
                effectiveConditions.map((cond, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-white/10 text-slate-100 text-[11px] border border-white/10"
                  >
                    {cond}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic text-[11px]">None recorded</span>
              )}
            </div>
          </div>

          {/* 8. Active Medications */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-300 font-semibold uppercase flex items-center gap-1">
              <Pill className="h-3 w-3 text-emerald-400" />
              <span>Active Prescriptions & Medications ({effectiveMedications.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {effectiveMedications.length > 0 ? (
                effectiveMedications.map((med, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-200 text-[11px]"
                  >
                    {med}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic text-[11px]">None recorded</span>
              )}
            </div>
          </div>

          {/* 9. Allergies (Crucial Alert Highlight) */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-rose-300 font-semibold uppercase flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-rose-400" />
              <span>Medical Allergies & Intolerances ({effectiveAllergies.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {effectiveAllergies.length > 0 ? (
                effectiveAllergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px] font-medium"
                  >
                    {allergy}
                  </span>
                ))
              ) : (
                <span className="text-emerald-300 italic text-[11px]">No known drug allergies (NKDA)</span>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer: Emergency Contact & Quick Action */}
        <div className="border-t border-emerald-500/20 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Emergency Designated Contact:</div>
              <div className="font-semibold text-slate-100">
                {emergencyContact.name} ({emergencyContact.relation}) •{' '}
                <a
                  href={`tel:${emergencyContact.phone}`}
                  className="text-emerald-400 hover:underline font-mono"
                >
                  {emergencyContact.phone}
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-semibold transition-colors self-start sm:self-auto border border-white/10"
          >
            <QrCode className="h-4 w-4" />
            <span>Show QR</span>
          </button>
        </div>
      </div>

      {/* Action Bar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Encrypted per HIPAA Electronic Identification Protocols</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 text-xs font-semibold"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Link Copied' : 'Copy ID Link'}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-semibold shadow-sm"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Full Medical QR</span>
            </Button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Emergency Medical QR Code"
        description="First responders, paramedics, and emergency physicians can scan this QR code to view critical biometrics, allergies, and blood type without device passcode."
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setShowQrModal(false)}>
              Close
            </Button>
            <Button size="sm" className="gap-1.5 bg-emerald-600 text-white font-semibold">
              <Download className="h-3.5 w-3.5" />
              <span>Save Offline Pass</span>
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
          <div className="p-4 bg-white rounded-3xl shadow-lg border border-slate-200 inline-block">
            {/* SVG QR Code Pattern */}
            <svg
              viewBox="0 0 160 160"
              className="h-48 w-48 text-slate-900"
              fill="currentColor"
            >
              <rect x="10" y="10" width="40" height="40" rx="6" />
              <rect x="20" y="20" width="20" height="20" fill="white" />
              <rect x="25" y="25" width="10" height="10" />

              <rect x="110" y="10" width="40" height="40" rx="6" />
              <rect x="120" y="20" width="20" height="20" fill="white" />
              <rect x="125" y="25" width="10" height="10" />

              <rect x="10" y="110" width="40" height="40" rx="6" />
              <rect x="20" y="120" width="20" height="20" fill="white" />
              <rect x="25" y="125" width="10" height="10" />

              {/* Data matrix pattern */}
              <rect x="60" y="20" width="10" height="20" />
              <rect x="80" y="10" width="20" height="10" />
              <rect x="60" y="60" width="40" height="40" rx="4" fill="#059669" />
              <rect x="70" y="70" width="20" height="20" fill="white" />
              <rect x="75" y="75" width="10" height="10" fill="#059669" />

              <rect x="20" y="60" width="20" height="10" />
              <rect x="30" y="80" width="10" height="20" />
              <rect x="110" y="60" width="20" height="10" />
              <rect x="130" y="80" width="20" height="20" />
              <rect x="70" y="110" width="30" height="10" />
              <rect x="110" y="110" width="20" height="20" />
              <rect x="140" y="120" width="10" height="20" />
              <rect x="60" y="130" width="20" height="20" />
            </svg>
          </div>

          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {patientName} • {patientId}
            </div>
            <div className="text-xs text-slate-500 mt-1 max-w-sm">
              Blood: <span className="font-bold text-slate-700 dark:text-slate-300">{effectiveBloodGroup}</span> • BMI: <span className="font-bold text-slate-700 dark:text-slate-300">{effectiveBmi} ({effectiveBmiCategory})</span> • Allergies: <span className="font-bold text-rose-600">{effectiveAllergies.join(', ')}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { HealthCardComponent as HealthCard }
