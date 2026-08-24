/**
 * Utility functions for Indian phone number normalization, display formatting,
 * and tap-to-call link generation.
 */

export function formatIndianPhone(phone?: string | null): string {
  if (!phone || !phone.trim()) return '—'

  const raw = phone.trim()
  const digits = raw.replace(/\D/g, '')

  // Standard 10 digit Indian mobile/landline
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }

  // 11 digits starting with 0
  if (digits.length === 11 && digits.startsWith('0')) {
    const ten = digits.slice(1)
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`
  }

  // 12 digits starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    const ten = digits.slice(2)
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`
  }

  // If starts with + and has digits
  if (raw.startsWith('+')) {
    return raw
  }

  return digits ? `+${digits}` : raw
}

export function cleanDialNumber(phone?: string | null): string {
  if (!phone || !phone.trim()) return ''

  const digits = phone.trim().replace(/\D/g, '')

  if (digits.length === 10) {
    return `tel:+91${digits}`
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `tel:+91${digits.slice(1)}`
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `tel:+${digits}`
  }
  if (phone.trim().startsWith('+')) {
    return `tel:+${digits}`
  }

  return `tel:${digits}`
}

export function isValidIndianPhone(phone?: string | null): boolean {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits)
  if (digits.length === 11 && digits.startsWith('0')) return /^[6-9]\d{9}$/.test(digits.slice(1))
  if (digits.length === 12 && digits.startsWith('91')) return /^[6-9]\d{9}$/.test(digits.slice(2))
  return false
}
