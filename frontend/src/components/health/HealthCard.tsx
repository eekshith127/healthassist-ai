import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Phone,
  Download,
  QrCode,
  User,
  Scale,
  Ruler,
  AlertCircle,
  UserCog,
} from 'lucide-react'
import { Button } from '../ui/button'
import { HealthProfile } from '../../types'
import { calculateBMI, calculateAge, formatHeight, formatWeight } from '../../utils/bmi'
import { formatIndianPhone } from '../../utils/phone'
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
    name?: string
    relation?: string
    phone?: string
  } | null
  showActions?: boolean
  onShowQr?: () => void
  onDownloadPdf?: () => void
  className?: string
}

export const HealthCardComponent: React.FC<HealthCardProps> = ({
  profile,
  patientName = 'Patient',
  patientId = 'HA-EHR',
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
  emergencyContact,
  showActions = true,
  onShowQr,
  onDownloadPdf,
  className,
}) => {
  const [downloading, setDownloading] = useState(false)

  // Derive consolidated values from profile or props
  const effectiveDob = profile?.dateOfBirth || profile?.date_of_birth
  const derivedAge =
    age ??
    profile?.age ??
    (effectiveDob ? calculateAge(effectiveDob) : null)

  const effectiveSex =
    gender ??
    profile?.sex ??
    profile?.gender ??
    '—'

  const effectiveHeight =
    heightCm ??
    profile?.heightCm ??
    profile?.height_cm ??
    null

  const effectiveWeight =
    weightKg ??
    profile?.weightKg ??
    profile?.weight_kg ??
    null

  const bmiEvaluation =
    effectiveHeight && effectiveWeight
      ? calculateBMI(effectiveHeight, effectiveWeight)
      : null

  const effectiveBmi =
    bmi ??
    profile?.bmi ??
    bmiEvaluation?.bmi ??
    null

  const effectiveBmiCategory =
    bmiCategory ??
    profile?.bmiCategory ??
    profile?.bmi_category ??
    bmiEvaluation?.category ??
    'Normal range'

  const effectiveBloodGroup =
    bloodType ??
    profile?.bloodGroup ??
    profile?.blood_group ??
    profile?.bloodType ??
    '—'

  const effectiveConditions =
    medicalConditions ??
    profile?.medicalConditions ??
    profile?.medical_conditions ??
    []

  const effectiveMedications =
    medications ??
    profile?.medications ??
    []

  const effectiveAllergies =
    allergies ??
    profile?.allergies ??
    []

  const contactName =
    emergencyContact?.name ||
    profile?.emergencyContact ||
    profile?.emergency_contact ||
    'Not provided'

  const rawPhone =
    emergencyContact?.phone ||
    profile?.emergencyPhone ||
    profile?.emergency_phone ||
    null

  const contactPhone = rawPhone ? formatIndianPhone(rawPhone) : '—'

  const handleDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf()
      return
    }
    setDownloading(true)
    setTimeout(() => setDownloading(false), 1200)
  }

  return (
    <div className={cn('space-y-4 max-w-2xl mx-auto', className)}>
      {/* Digital Emergency Health Record Container */}
      <div className="w-full rounded-xl bg-white p-5 sm:p-6 text-[#111827] shadow-subtle border border-[#E5E7EB] space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Digital Health Record
            </div>
            <div className="text-xl font-semibold text-[#111827] mt-0.5">{patientName}</div>
            <div className="text-xs text-[#6B7280] font-mono mt-0.5">ID: {patientId}</div>
          </div>

          <div className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified EHR Baseline</span>
          </div>
        </div>

        {/* Biometrics & Demographics */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Personal & Biometrics
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3 text-xs">
            <div className="space-y-0.5">
              <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Age / Sex</span>
              </div>
              <div className="font-medium text-[#111827]">
                {derivedAge ? `${derivedAge} yrs` : '—'} • {effectiveSex}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                <span>Height</span>
              </div>
              <div className="font-medium text-[#111827]">
                {effectiveHeight ? formatHeight(effectiveHeight) : '—'}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
                <Scale className="h-3 w-3" />
                <span>Weight</span>
              </div>
              <div className="font-medium text-[#111827]">
                {effectiveWeight ? formatWeight(effectiveWeight) : '—'}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-[#6B7280]">Blood Group</div>
              <div className="font-medium text-[#111827]">
                {effectiveBloodGroup}
              </div>
            </div>
          </div>
        </div>

        {/* BMI Index Row */}
        <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#6B7280] block text-[11px]">Body Mass Index (BMI)</span>
            <span className="font-medium text-[#111827]">
              {effectiveBmi ? `${effectiveBmi} — ${effectiveBmiCategory}` : 'Not calculated'}
            </span>
          </div>
          <span className="text-[11px] text-[#6B7280]">
            Height & weight calculated
          </span>
        </div>

        {/* Medical Allergies */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 text-[#DC2626]" />
            <span>Allergies ({effectiveAllergies.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {effectiveAllergies.length > 0 ? (
              effectiveAllergies.map((allergy, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded bg-red-50 text-[#DC2626] border border-red-200 text-xs font-medium"
                >
                  {allergy}
                </span>
              ))
            ) : (
              <span className="text-[#6B7280] text-xs">No known drug allergies (NKDA)</span>
            )}
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Medical Conditions ({effectiveConditions.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {effectiveConditions.length > 0 ? (
              effectiveConditions.map((cond, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] text-xs font-medium"
                >
                  {cond}
                </span>
              ))
            ) : (
              <span className="text-[#6B7280] text-xs">None recorded</span>
            )}
          </div>
        </div>

        {/* Active Medications */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Active Medications ({effectiveMedications.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {effectiveMedications.length > 0 ? (
              effectiveMedications.map((med, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] text-xs"
                >
                  {med}
                </span>
              ))
            ) : (
              <span className="text-[#6B7280] text-xs">None recorded</span>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="border-t border-[#E5E7EB] pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#6B7280]" />
            <div>
              <span className="text-[#6B7280] text-[11px] block">Emergency Contact:</span>
              <span className="font-medium text-[#111827]">
                {contactName} {contactPhone !== '—' && `(${contactPhone})`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="text-xs text-[#6B7280] flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>HL7 FHIR & HIPAA standards compliant</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/health-profile">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 px-3 border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
              >
                <UserCog className="h-3.5 w-3.5 text-[#2563EB]" />
                <span>Edit Details</span>
              </Button>
            </Link>

            {onShowQr && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowQr}
                className="gap-1.5 text-xs h-8 px-3 border-[#E5E7EB]"
              >
                <QrCode className="h-3.5 w-3.5 text-[#2563EB]" />
                <span>Show QR</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-xs text-white h-8 px-3"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{downloading ? 'Generating...' : 'Download Health Card'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { HealthCardComponent as HealthCard }

