import { jsPDF } from 'jspdf'
import { HealthProfile } from '../types'
import { calculateBMI, calculateAge, formatHeight, formatWeight } from './bmi'
import { formatIndianPhone } from './phone'

interface GeneratePdfOptions {
  patientName: string
  patientId: string
  profile?: HealthProfile | null
  qrUrl?: string | null
  qrDataUrl?: string | null
}

export function generateHealthCardPdf({
  patientName,
  patientId,
  profile,
  qrUrl,
  qrDataUrl,
}: GeneratePdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // Derive clinical variables
  const effectiveDob = profile?.dateOfBirth || profile?.date_of_birth
  const derivedAge =
    profile?.age ?? (effectiveDob ? calculateAge(effectiveDob) : null)
  const effectiveSex = profile?.sex || profile?.gender || '—'
  const effectiveHeight = profile?.heightCm ?? profile?.height_cm ?? null
  const effectiveWeight = profile?.weightKg ?? profile?.weight_kg ?? null

  const bmiCalc =
    effectiveHeight && effectiveWeight
      ? calculateBMI(effectiveHeight, effectiveWeight)
      : null
  const effectiveBmi = profile?.bmi ?? bmiCalc?.bmi ?? null
  const effectiveBmiCat =
    profile?.bmiCategory ?? profile?.bmi_category ?? bmiCalc?.category ?? '—'
  const effectiveBloodGroup =
    profile?.bloodGroup ?? profile?.blood_group ?? profile?.bloodType ?? '—'

  const effectiveAllergies = profile?.allergies || []
  const effectiveConditions =
    profile?.medicalConditions || profile?.medical_conditions || []
  const effectiveMedications = profile?.medications || []

  const emergencyName =
    profile?.emergencyContact || profile?.emergency_contact || 'Not provided'
  const emergencyPhone = formatIndianPhone(
    profile?.emergencyPhone || profile?.emergency_phone
  )

  let y = 16

  // 1. Top Clinical Header (Navy Blue theme)
  doc.setFillColor(30, 58, 138) // Deep Blue
  doc.rect(margin, y, contentWidth, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('TRISHUL AI', margin + 6, y + 9)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('EMERGENCY DIGITAL HEALTH CARD', margin + 6, y + 16)

  doc.setFontSize(9)
  doc.text(`Record ID: ${patientId}`, pageWidth - margin - 6, y + 13, {
    align: 'right',
  })

  y += 28

  // 2. Patient Demographics & Baseline Biometrics Box
  doc.setDrawColor(229, 231, 235) // Light gray border
  doc.setFillColor(249, 250, 251) // Subtly gray background
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD')

  // Patient Name Header
  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(patientName || 'Patient', margin + 6, y + 8)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(
    `Verified Electronic Health Baseline • Age: ${derivedAge ? `${derivedAge} yrs` : '—'} • Sex: ${effectiveSex}`,
    margin + 6,
    y + 14
  )

  // Biometrics Grid inside patient box
  const bioY = y + 20
  doc.setDrawColor(229, 231, 235)
  doc.line(margin + 4, bioY - 2, pageWidth - margin - 4, bioY - 2)

  const colWidth = (contentWidth - 12) / 4

  // Col 1: Height
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('HEIGHT', margin + 6, bioY + 4)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(effectiveHeight ? formatHeight(effectiveHeight) : '—', margin + 6, bioY + 11)

  // Col 2: Weight
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('WEIGHT', margin + 6 + colWidth, bioY + 4)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(effectiveWeight ? formatWeight(effectiveWeight) : '—', margin + 6 + colWidth, bioY + 11)

  // Col 3: Blood Group
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('BLOOD GROUP', margin + 6 + colWidth * 2, bioY + 4)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38) // Highlight red for blood group
  doc.text(effectiveBloodGroup, margin + 6 + colWidth * 2, bioY + 11)

  // Col 4: BMI
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('BMI INDEX', margin + 6 + colWidth * 3, bioY + 4)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(
    effectiveBmi ? `${effectiveBmi} (${effectiveBmiCat})` : '—',
    margin + 6 + colWidth * 3,
    bioY + 11
  )

  y += 44

  // 3. Medical Information Section
  const leftColWidth = contentWidth * 0.62
  const rightColWidth = contentWidth * 0.35
  const colGap = contentWidth * 0.03
  const rightColX = margin + leftColWidth + colGap

  const medStartY = y

  // Allergies
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38) // Red
  doc.text('CRITICAL ALLERGIES & SENSITIVITIES', margin, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(31, 41, 55)
  if (effectiveAllergies.length > 0) {
    effectiveAllergies.forEach((allergy) => {
      doc.text(`• ${allergy}`, margin + 3, y)
      y += 5
    })
  } else {
    doc.setTextColor(107, 114, 128)
    doc.text('No known drug allergies recorded (NKDA)', margin + 3, y)
    y += 5
  }

  y += 3

  // Medical Conditions
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('CHRONIC MEDICAL CONDITIONS', margin, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(31, 41, 55)
  if (effectiveConditions.length > 0) {
    effectiveConditions.forEach((cond) => {
      doc.text(`• ${cond}`, margin + 3, y)
      y += 5
    })
  } else {
    doc.setTextColor(107, 114, 128)
    doc.text('None recorded', margin + 3, y)
    y += 5
  }

  y += 3

  // Active Medications
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('ACTIVE MEDICATIONS & REGIMENS', margin, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(31, 41, 55)
  if (effectiveMedications.length > 0) {
    effectiveMedications.forEach((med) => {
      doc.text(`• ${med}`, margin + 3, y)
      y += 5
    })
  } else {
    doc.setTextColor(107, 114, 128)
    doc.text('None recorded', margin + 3, y)
    y += 5
  }

  // Right Column: QR Code Box
  let qrBoxY = medStartY - 2
  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(rightColX, qrBoxY, rightColWidth, 68, 2, 2, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 138)
  doc.text('SCAN FOR LIVE EHR', rightColX + rightColWidth / 2, qrBoxY + 7, {
    align: 'center',
  })

  // Embed QR Image if available
  if (qrDataUrl) {
    try {
      const qrSize = 42
      const qrX = rightColX + (rightColWidth - qrSize) / 2
      doc.addImage(qrDataUrl, 'PNG', qrX, qrBoxY + 11, qrSize, qrSize)
    } catch (e) {
      console.error('Error attaching QR to PDF:', e)
    }
  }

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('Secure Read-Only Access', rightColX + rightColWidth / 2, qrBoxY + 59, {
    align: 'center',
  })
  doc.text('First Responder Verified', rightColX + rightColWidth / 2, qrBoxY + 64, {
    align: 'center',
  })

  y = Math.max(y + 6, qrBoxY + 74)

  // 4. Emergency Contacts Section
  doc.setDrawColor(229, 231, 235)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('EMERGENCY CONTACTS & HOTLINES (INDIA)', margin + 6, y + 7)

  const halfWidth = (contentWidth - 12) / 2

  // Left subcol: Personal ICE
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('DESIGNATED PERSONAL CONTACT (ICE)', margin + 6, y + 14)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(emergencyName, margin + 6, y + 20)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(37, 99, 235) // Blue phone
  doc.text(emergencyPhone, margin + 6, y + 26)

  // Right subcol: National 112 & AIIMS Poison
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('NATIONAL EMERGENCY DISPATCH', margin + 6 + halfWidth, y + 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38)
  doc.text('112', margin + 6 + halfWidth, y + 20)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('AIIMS National Poisons Information Centre: 1800-116-117', margin + 6 + halfWidth, y + 26)

  y += 38

  // 5. Footer & Legal Disclaimer
  doc.setDrawColor(229, 231, 235)
  doc.line(margin, y, pageWidth - margin, y)
  y += 5

  const nowStr = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(`Last Generated: ${nowStr} • TRISHUL AI Clinical Telemedicine Architecture`, margin, y)
  y += 4

  const disclaimer =
    'Disclaimer: This digital health card contains user-provided health information and is intended for health-awareness and emergency reference purposes. It is not a formal medical diagnosis or prescription.'
  const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth)
  doc.text(splitDisclaimer, margin, y)

  // Save the PDF
  const sanitizedName = (patientName || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`TRISHUL-Health-Card-${sanitizedName}.pdf`)
}
