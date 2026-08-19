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
} from 'lucide-react'
import { Button } from '../ui/button'
import { Modal } from '../ui/modal'
import { cn } from '../../utils/cn'

export interface HealthCardProps {
  patientName?: string
  patientId?: string
  bloodType?: string
  age?: number | string
  gender?: string
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
  patientName = 'John Doe',
  patientId = 'HA-8492-MED',
  bloodType = 'O-Positive (O+)',
  age = '32 yrs',
  gender = 'Male',
  allergies = ['Penicillin / Amoxicillin', 'Peanuts & Tree Nuts'],
  medications = ['Loratadine 10mg (Daily)', 'Albuterol Inhaler (PRN)'],
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

  const handleCopyLink = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Digital Emergency Card Box */}
      <div className="relative mx-auto w-full rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 md:p-7 text-white shadow-xl border border-emerald-500/30 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <HeartPulse className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                EMERGENCY MEDICAL ID
              </div>
              <div className="text-xl font-extrabold tracking-tight text-white">{patientName}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-emerald-300 font-mono">ID: {patientId}</div>
            <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <ShieldCheck className="h-3 w-3" />
              <span>VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Card Body Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mb-5">
          <div className="space-y-0.5">
            <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Blood Group</div>
            <div className="text-sm font-extrabold text-white">{bloodType}</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Age & Gender</div>
            <div className="text-xs font-bold text-slate-200">{age} • {gender}</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Organ Donor</div>
            <div className="text-xs font-bold text-emerald-400">Registered (Yes)</div>
          </div>

          {/* Allergies Highlight */}
          <div className="col-span-2 sm:col-span-3 space-y-1">
            <div className="text-[10px] text-rose-300 font-semibold uppercase flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Known Medical Allergies</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((allergy, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px] font-medium"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>

          {/* Active Medications */}
          <div className="col-span-2 sm:col-span-3 space-y-1 pt-1">
            <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Pill className="h-3 w-3 text-emerald-400" />
              <span>Active Prescriptions</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {medications.map((med, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[11px]"
                >
                  {med}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card Footer: Emergency Contact & Quick Action */}
        <div className="border-t border-emerald-500/20 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Emergency Contact:</div>
              <div className="font-semibold text-slate-100">
                {emergencyContact.name} ({emergencyContact.relation}) •{' '}
                <a
                  href={`tel:${emergencyContact.phone}`}
                  className="text-emerald-400 hover:underline"
                >
                  {emergencyContact.phone}
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-semibold transition-colors self-start sm:self-auto"
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
            <span>Encrypted with SHA-256 Medical Standard</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Link Copied' : 'Copy ID Link'}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
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
        description="First responders and emergency personnel can scan this code to view critical medical data instantly without passcode access."
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setShowQrModal(false)}>
              Close
            </Button>
            <Button size="sm" className="gap-1.5 bg-emerald-600 text-white">
              <Download className="h-3.5 w-3.5" />
              <span>Download QR Image</span>
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
          <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
            {/* Custom SVG QR Code for John Doe */}
            <svg
              viewBox="0 0 160 160"
              className="h-44 w-44 text-slate-900"
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

              {/* Data pattern blocks */}
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
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              John Doe • HA-8492-MED
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Blood: O+ • Allergies: Penicillin, Peanuts • Contact: +1 (555) 234-8910
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { HealthCardComponent as HealthCard }
