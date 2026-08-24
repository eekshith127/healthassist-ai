import React, { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  ShieldCheck,
  Download,
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import { Button } from '../ui/button'

interface QrCodeModalProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  loading?: boolean
  onRevoke: () => Promise<void>
  onRegenerate: () => Promise<void>
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  token,
  loading = false,
  onRevoke,
  onRegenerate,
}) => {
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const baseUrl = window.location.origin
  const qrUrl = token ? `${baseUrl}/health-card/${token}` : ''

  const handleDownloadQr = () => {
    const canvas = document.getElementById('trishul-qr-canvas') as HTMLCanvasElement
    if (!canvas) return
    const pngUrl = canvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = 'TRISHUL-Health-Card-QR.png'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const handleCopyLink = () => {
    if (!qrUrl) return
    navigator.clipboard.writeText(qrUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmRevoke = async () => {
    setRevoking(true)
    try {
      await onRevoke()
      setShowRevokeConfirm(false)
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">
              Digital Health Card
            </h3>
            <p className="text-xs text-[#6B7280]">
              Scan this QR code to view the health card.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="h-8 w-8 text-[#2563EB] animate-spin" />
              <p className="text-xs text-[#6B7280]">Generating secure QR share token...</p>
            </div>
          ) : token ? (
            <div className="space-y-4">
              {/* QR Code Canvas */}
              <div
                ref={canvasRef}
                className="flex flex-col items-center justify-center p-5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]"
              >
                <div className="p-3 bg-white rounded-lg shadow-sm border border-[#E5E7EB]">
                  <QRCodeCanvas
                    id="trishul-qr-canvas"
                    value={qrUrl}
                    size={240}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#2563EB] font-medium bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#DBEAFE]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Read-only access</span>
                </div>
              </div>

              {/* Secure Link Row */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                <span className="font-mono text-[#4B5563] truncate mr-2">
                  {qrUrl}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-7 px-2 text-xs gap-1 text-[#374151]"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#16A34A]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-[#6B7280] hover:text-[#2563EB]"
                    title="Open public link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Revoke confirmation card or action buttons */}
              {showRevokeConfirm ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#DC2626]">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Revoke this QR Access Link?</span>
                  </div>
                  <p className="text-[#991B1B] text-[11px] leading-relaxed">
                    Anyone scanning this QR code in the future will be denied access.
                    You can generate a brand new QR code anytime.
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRevokeConfirm(false)}
                      disabled={revoking}
                      className="h-7 text-xs px-2.5"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmRevoke}
                      disabled={revoking}
                      className="h-7 text-xs px-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                    >
                      {revoking ? 'Revoking...' : 'Yes, Revoke'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevokeConfirm(true)}
                    className="text-xs text-[#DC2626] border-red-200 hover:bg-red-50 h-8 px-2.5"
                  >
                    Revoke QR
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleDownloadQr}
                    className="text-xs gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-8 px-3"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download QR</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-[#6B7280]">
                No active QR share token found. Generate one now to enable emergency sharing.
              </p>
              <Button
                onClick={onRegenerate}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs"
              >
                Generate QR
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-3 border-[#E5E7EB]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
