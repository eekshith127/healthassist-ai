import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PhoneCall,
  ShieldCheck,
  QrCode,
  Download,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  UserCog,
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { HealthCard as HealthCardWidget } from '../components/health/HealthCard'
import { QrCodeModal } from '../components/health/QrCodeModal'
import { profileApi, healthCardApi } from '../services/api'
import { normalizeProfile } from '../services/profileService'
import { HealthProfile } from '../types'
import { formatIndianPhone, cleanDialNumber } from '../utils/phone'
import { generateHealthCardPdf } from '../utils/pdfGenerator'

export const HealthCard: React.FC = () => {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const patientName = user?.fullName || user?.firstName || 'Patient'
  const patientId = user?.id ? `HA-${user.id.slice(-6).toUpperCase()}` : 'HA-EHR'

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const token = await getToken()
        if (token) {
          const [rawProfile, shareInfo] = await Promise.allSettled([
            profileApi.getProfile(token),
            healthCardApi.getShare(token),
          ])

          if (isMounted) {
            if (rawProfile.status === 'fulfilled' && rawProfile.value) {
              setProfile(normalizeProfile(rawProfile.value))
            }
            if (shareInfo.status === 'fulfilled' && shareInfo.value.is_active) {
              setShareToken(shareInfo.value.token)
            }
          }
        }
      } catch (err) {
        console.error('Error loading health card profile or share:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [getToken])

  const handleOpenQrModal = async () => {
    setQrModalOpen(true)
    if (!shareToken) {
      setQrLoading(true)
      try {
        const token = await getToken()
        const res = await healthCardApi.generateShare(token)
        if (res.is_active && res.token) {
          setShareToken(res.token)
        }
      } catch (err) {
        console.error('Error generating share token:', err)
      } finally {
        setQrLoading(false)
      }
    }
  }

  const handleRevokeShare = async () => {
    try {
      const token = await getToken()
      await healthCardApi.revokeShare(token)
      setShareToken(null)
    } catch (err) {
      console.error('Error revoking share token:', err)
    }
  }

  const handleRegenerateShare = async () => {
    setQrLoading(true)
    try {
      const token = await getToken()
      const res = await healthCardApi.generateShare(token)
      if (res.is_active && res.token) {
        setShareToken(res.token)
      }
    } catch (err) {
      console.error('Error regenerating share token:', err)
    } finally {
      setQrLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      // If no share token exists yet, generate one first so the PDF includes a working QR code
      let currentToken = shareToken
      if (!currentToken) {
        const token = await getToken()
        const res = await healthCardApi.generateShare(token)
        if (res.is_active && res.token) {
          currentToken = res.token
          setShareToken(res.token)
        }
      }

      // Grab QR code canvas data URL
      let qrDataUrl: string | null = null
      const offscreenCanvas = document.getElementById(
        'pdf-export-qr-canvas'
      ) as HTMLCanvasElement
      if (offscreenCanvas) {
        qrDataUrl = offscreenCanvas.toDataURL('image/png')
      }

      const qrUrl = currentToken
        ? `${window.location.origin}/health-card/${currentToken}`
        : null

      generateHealthCardPdf({
        patientName,
        patientId,
        profile,
        qrUrl,
        qrDataUrl,
      })
    } catch (err) {
      console.error('Error exporting PDF health card:', err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const hasPersonalContact = Boolean(
    profile?.emergencyContact || profile?.emergencyPhone
  )

  const formattedEmergencyPhone = formatIndianPhone(profile?.emergencyPhone)
  const emergencyPhoneDial = cleanDialNumber(profile?.emergencyPhone)

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#111827] leading-tight">
            Digital Health Card
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Standardized electronic clinical emergency record and baseline biometrics.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/health-profile">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 px-3 border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
            >
              <UserCog className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Edit Profile</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenQrModal}
            className="gap-1.5 text-xs h-8 px-3 border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
          >
            <QrCode className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>{shareToken ? 'Show QR' : 'Generate QR'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-3"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{downloadingPdf ? 'Exporting PDF...' : 'Download Health Card'}</span>
          </Button>
        </div>
      </div>

      {/* Main Interactive Digital ID Card */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center p-12">
            <RefreshCw className="h-6 w-6 text-[#2563EB] animate-spin" />
          </div>
        ) : (
          <HealthCardWidget
            profile={profile}
            patientName={patientName}
            patientId={patientId}
            showActions={true}
            onShowQr={handleOpenQrModal}
            onDownloadPdf={handleDownloadPdf}
          />
        )}
      </div>

      {/* Emergency Contacts & First Responder Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Emergency Contacts (India Localized) */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5 space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-[#111827] flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-[#DC2626]" />
              <span>Emergency Contacts</span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Direct emergency dispatch and designated emergency contacts
            </p>
          </div>

          <div className="space-y-2 text-xs">
            {/* National 112 */}
            <a
              href="tel:112"
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
            >
              <div>
                <span className="font-medium text-[#111827] block">
                  National Emergency Dispatch
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  Ambulance, Police, Fire (All India)
                </span>
              </div>
              <span className="font-mono font-bold text-[#DC2626] text-xs">
                112
              </span>
            </a>

            {/* AIIMS Poison Control */}
            <a
              href="tel:1800116117"
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
            >
              <div>
                <span className="text-[#4B5563] block">
                  Poison Control Centre
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  AIIMS National Poisons Information Centre
                </span>
              </div>
              <span className="font-mono text-[#2563EB] text-xs font-semibold">
                1800-116-117
              </span>
            </a>

            {/* Personal Emergency Contact */}
            {hasPersonalContact ? (
              <a
                href={emergencyPhoneDial || `tel:${profile?.emergencyPhone}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] hover:bg-[#DBEAFE]/70 transition-colors"
              >
                <div>
                  <span className="font-medium text-[#1E40AF] block">
                    {profile?.emergencyContact || 'Personal Emergency Contact'}
                  </span>
                  <span className="text-[10px] text-[#3B82F6]">
                    Designated Next of Kin (ICE)
                  </span>
                </div>
                <span className="font-mono text-[#1D4ED8] font-semibold text-xs">
                  {formattedEmergencyPhone}
                </span>
              </a>
            ) : (
              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-dashed border-[#D1D5DB] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs text-[#6B7280] font-medium block">
                    No emergency contact added.
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    Add a next of kin phone number for first responders
                  </span>
                </div>
                <Link to="/health-profile">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 gap-1 border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF]"
                  >
                    <PlusCircle className="h-3 w-3" />
                    <span>Add emergency contact</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* First Responder Verification */}
        <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5 space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-[#111827] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
              <span>EMS & Clinical Verification</span>
            </div>
            <p className="text-xs text-[#6B7280]">Standards compliant with HL7 FHIR & HIPAA</p>
          </div>

          <div className="space-y-2 text-xs text-[#6B7280] leading-relaxed">
            <p>
              This digital record provides read-only baseline access for paramedics, emergency physicians, and authorized clinical triage workflows.
            </p>
            <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151] font-medium text-[11px]">
              Verified Patient ID: <span className="font-mono text-[10px] text-[#6B7280]">{patientId}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* QR Modal Component */}
      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        token={shareToken}
        loading={qrLoading}
        onRevoke={handleRevokeShare}
        onRegenerate={handleRegenerateShare}
      />

      {/* Hidden QR canvas for PDF export */}
      {shareToken && (
        <div className="hidden" aria-hidden="true">
          <QRCodeCanvas
            id="pdf-export-qr-canvas"
            value={`${window.location.origin}/health-card/${shareToken}`}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>
      )}
    </div>
  )
}

export default HealthCard
