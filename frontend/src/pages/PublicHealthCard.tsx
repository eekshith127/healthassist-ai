import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  User,
  Scale,
  Ruler,
  AlertCircle,
  Phone,
  RefreshCw,
  Info,
} from 'lucide-react'
import { healthCardApi } from '../services/api'
import { PublicHealthCardData } from '../types'
import { formatHeight, formatWeight } from '../utils/bmi'
import { Card } from '../components/ui/card'

export const PublicHealthCard: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [cardData, setCardData] = useState<PublicHealthCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function fetchCard() {
      if (!token) {
        setError('Invalid health card link.')
        setLoading(false)
        return
      }

      try {
        const data = await healthCardApi.getPublicCard(token)
        if (isMounted) {
          setCardData(data)
          setError(null)
        }
      } catch (err: any) {
        if (isMounted) {
          const detail =
            err.response?.data?.detail ||
            'This health card link has been revoked or is no longer active.'
          setError(detail)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchCard()
    return () => {
      isMounted = false
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3 bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-subtle max-w-sm w-full text-center">
          <RefreshCw className="h-8 w-8 text-[#2563EB] animate-spin" />
          <h2 className="text-sm font-semibold text-[#111827]">
            Loading Emergency Health Card
          </h2>
          <p className="text-xs text-[#6B7280]">
            Validating cryptographic share token...
          </p>
        </div>
      </div>
    )
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-subtle p-6 text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
            <ShieldAlert className="h-6 w-6 text-[#DC2626]" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-[#111827]">
              Health Card Access Denied
            </h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              {error || 'This health card link has been revoked.'}
            </p>
          </div>

          {/* Fallback Emergency Hotlines */}
          <div className="pt-2 text-left space-y-2 border-t border-[#E5E7EB]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Emergency Hotlines (India)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F3F4F6] text-xs transition-colors"
              >
                <span className="font-medium text-[#111827]">Dispatch</span>
                <span className="font-mono font-bold text-[#DC2626]">112</span>
              </a>
              <a
                href="tel:1800116117"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F3F4F6] text-xs transition-colors"
              >
                <span className="text-[#4B5563]">AIIMS Poison</span>
                <span className="font-mono text-[#2563EB]">1800-116-117</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-6 px-4 sm:px-6">
      <div className="max-w-[600px] mx-auto space-y-4">
        {/* Top Header Banner */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wider text-[#2563EB] uppercase">
                  TRISHUL AI
                </span>
                <span className="text-xs text-[#9CA3AF]">•</span>
                <span className="text-xs font-semibold text-[#111827]">
                  Digital Health Card
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#111827] mt-1">
                {cardData.patient_name}
              </h1>
              <p className="text-xs font-mono text-[#6B7280] mt-0.5">
                Record ID: {cardData.patient_identifier}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE] text-xs font-medium shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Read-Only</span>
            </div>
          </div>

          {/* Biometrics & Demographics Grid */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Patient Baseline & Biometrics
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB] text-xs">
              <div>
                <span className="text-[10px] text-[#6B7280] flex items-center gap-1">
                  <User className="h-3 w-3" /> Age / Sex
                </span>
                <span className="font-semibold text-[#111827] block mt-0.5">
                  {cardData.age ? `${cardData.age} yrs` : '—'} • {cardData.sex || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#6B7280] flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Height
                </span>
                <span className="font-semibold text-[#111827] block mt-0.5">
                  {cardData.height_cm ? formatHeight(cardData.height_cm) : '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#6B7280] flex items-center gap-1">
                  <Scale className="h-3 w-3" /> Weight
                </span>
                <span className="font-semibold text-[#111827] block mt-0.5">
                  {cardData.weight_kg ? formatWeight(cardData.weight_kg) : '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#6B7280]">Blood Group</span>
                <span className="font-bold text-[#DC2626] block mt-0.5 text-sm">
                  {cardData.blood_group || '—'}
                </span>
              </div>
            </div>

            {/* BMI Row */}
            {cardData.bmi && (
              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-[#6B7280] text-[11px]">Body Mass Index (BMI):</span>
                <span className="font-medium text-[#111827]">
                  {cardData.bmi} — {cardData.bmi_category || 'Normal'}
                </span>
              </div>
            )}
          </div>

          {/* Critical Allergies */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-[#DC2626]" />
              <span>Allergies ({cardData.allergies.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cardData.allergies.length > 0 ? (
                cardData.allergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-red-50 text-[#DC2626] border border-red-200 text-xs font-semibold"
                  >
                    {allergy}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#6B7280] bg-[#F9FAFB] px-2.5 py-1 rounded border border-[#E5E7EB]">
                  No known drug allergies (NKDA)
                </span>
              )}
            </div>
          </div>

          {/* Chronic Medical Conditions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] block">
              Medical Conditions ({cardData.medical_conditions.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cardData.medical_conditions.length > 0 ? (
                cardData.medical_conditions.map((cond, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] text-xs font-medium"
                  >
                    {cond}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#6B7280]">None recorded</span>
              )}
            </div>
          </div>

          {/* Active Medications */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] block">
              Active Medications ({cardData.medications.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cardData.medications.length > 0 ? (
                cardData.medications.map((med, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] text-xs"
                  >
                    {med}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#6B7280]">None recorded</span>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contacts Section */}
        <Card className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-subtle space-y-3.5">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-[#DC2626]" />
              <span>Emergency Contacts & Hotlines (India)</span>
            </div>
            <p className="text-[11px] text-[#6B7280]">
              Direct one-touch phone connections for emergency triage
            </p>
          </div>

          <div className="space-y-2">
            {/* 112 National Emergency */}
            <a
              href="tel:112"
              className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 border border-red-200 hover:bg-red-100/60 transition-colors"
            >
              <div>
                <span className="font-semibold text-xs text-[#991B1B] block">
                  National Emergency Dispatch
                </span>
                <span className="text-[10px] text-[#DC2626]">
                  Ambulance, Police & Fire (All India)
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-[#DC2626]">
                112
              </span>
            </a>

            {/* AIIMS Poison Control */}
            <a
              href="tel:1800116117"
              className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
            >
              <div>
                <span className="font-medium text-xs text-[#111827] block">
                  Poison Control Centre
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  AIIMS National Poisons Information Centre
                </span>
              </div>
              <span className="font-mono font-semibold text-xs text-[#2563EB]">
                1800-116-117
              </span>
            </a>

            {/* Personal Emergency Contact */}
            {cardData.emergency_phone && (
              <a
                href={cardData.emergency_phone_dial || `tel:${cardData.emergency_phone}`}
                className="flex items-center justify-between p-3 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] hover:bg-[#DBEAFE]/70 transition-colors"
              >
                <div>
                  <span className="font-semibold text-xs text-[#1E40AF] block">
                    {cardData.emergency_contact || 'Personal Emergency Contact'}
                  </span>
                  <span className="text-[10px] text-[#3B82F6]">
                    Designated Next of Kin (ICE)
                  </span>
                </div>
                <span className="font-mono font-semibold text-xs text-[#1D4ED8]">
                  {cardData.emergency_phone}
                </span>
              </a>
            )}
          </div>
        </Card>

        {/* Disclaimer & Footer */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] text-center space-y-2 text-[11px] text-[#6B7280]">
          <div className="flex items-center justify-center gap-1 text-[#4B5563] font-medium">
            <Info className="h-3.5 w-3.5" />
            <span>Clinical Notice</span>
          </div>
          <p className="leading-relaxed text-[10.5px]">
            {cardData.disclaimer}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PublicHealthCard
