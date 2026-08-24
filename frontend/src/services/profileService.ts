import { HealthProfile } from '../types'
import { calculateBMI, calculateAge } from '../utils/bmi'

/**
 * Calculates profile completion breakdown and percentage from actual database records.
 */
export interface ProfileCompletionItem {
  id: string
  label: string
  completed: boolean
  description: string
}

export interface ProfileCompletionReport {
  percentage: number
  completedCount: number
  totalCount: number
  items: ProfileCompletionItem[]
}

export function calculateProfileCompletion(profile: HealthProfile | null): ProfileCompletionReport {
  if (!profile) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: 6,
      items: [
        { id: 'demographics', label: 'Demographics & DOB', completed: false, description: 'Age and biological sex' },
        { id: 'biometrics', label: 'Biometrics & Blood Group', completed: false, description: 'Height, weight, and blood type' },
        { id: 'conditions', label: 'Medical History', completed: false, description: 'Chronic conditions' },
        { id: 'medications', label: 'Active Medications', completed: false, description: 'Current prescriptions' },
        { id: 'allergies', label: 'Allergies & Intolerances', completed: false, description: 'Drug and food allergies' },
        { id: 'emergency', label: 'Emergency Contact', completed: false, description: 'Next of kin phone number' },
      ],
    }
  }

  const hasDob = Boolean(profile.dateOfBirth || profile.date_of_birth || profile.age)
  const hasSex = Boolean(profile.sex || profile.gender)
  const hasHeight = Boolean((profile.heightCm || profile.height_cm) && Number(profile.heightCm || profile.height_cm) > 0)
  const hasWeight = Boolean((profile.weightKg || profile.weight_kg) && Number(profile.weightKg || profile.weight_kg) > 0)
  const hasBlood = Boolean(profile.bloodGroup || profile.blood_group || profile.bloodType || profile.blood_type)

  const hasDemographics = hasDob && hasSex
  const hasBiometrics = hasHeight && hasWeight && hasBlood

  const conditionsList = profile.medicalConditions || profile.medical_conditions
  const hasConditions = Array.isArray(conditionsList) && conditionsList.length > 0

  const medicationsList = profile.medications
  const hasMedications = Array.isArray(medicationsList) && medicationsList.length > 0

  const allergiesList = profile.allergies
  const hasAllergies = Array.isArray(allergiesList) && allergiesList.length > 0

  const hasEmergency = Boolean(profile.emergencyContact || profile.emergency_contact || profile.emergencyPhone || profile.emergency_phone)

  const items: ProfileCompletionItem[] = [
    {
      id: 'demographics',
      label: 'Demographics & Sex',
      completed: hasDemographics,
      description: hasDemographics
        ? `${profile.age ?? 'Age set'} yrs • ${profile.sex || profile.gender || 'Specified'}`
        : 'Missing date of birth or sex',
    },
    {
      id: 'biometrics',
      label: 'Biometrics & Blood Group',
      completed: hasBiometrics,
      description: hasBiometrics
        ? `${profile.bloodGroup || profile.blood_group || profile.bloodType || 'Type set'} • BMI ${profile.bmi || 'calculated'}`
        : 'Missing height, weight, or blood group',
    },
    {
      id: 'conditions',
      label: 'Chronic Conditions',
      completed: hasConditions,
      description: hasConditions ? `${conditionsList!.length} logged` : 'None logged',
    },
    {
      id: 'medications',
      label: 'Active Prescriptions',
      completed: hasMedications,
      description: hasMedications ? `${medicationsList!.length} active` : 'None logged',
    },
    {
      id: 'allergies',
      label: 'Drug & Food Allergies',
      completed: hasAllergies,
      description: hasAllergies ? `${allergiesList!.length} recorded` : 'No allergies recorded',
    },
    {
      id: 'emergency',
      label: 'Emergency Contact (ICE)',
      completed: hasEmergency,
      description: hasEmergency ? 'Emergency contact saved' : 'Not provided',
    },
  ]

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const percentage = Math.round((completedCount / totalCount) * 100)

  return {
    percentage,
    completedCount,
    totalCount,
    items,
  }
}

/**
 * Normalizes backend profile response to frontend interface
 */
export function normalizeProfile(raw: Record<string, any> | null): HealthProfile | null {
  if (!raw) return null

  const height = raw.height_cm ?? raw.heightCm ?? null
  const weight = raw.weight_kg ?? raw.weightKg ?? null
  const dob = raw.date_of_birth ?? raw.dateOfBirth ?? null

  const bmiEval = height && weight ? calculateBMI(height, weight) : null
  const ageVal = dob ? calculateAge(dob) : raw.age ?? null

  const parseList = (val: any): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // fallback
    }
    return String(val).split(',').map((s) => s.trim()).filter(Boolean)
  }

  return {
    id: raw.id ?? null,
    userId: raw.user_id ?? raw.userId ?? null,
    dateOfBirth: dob,
    date_of_birth: dob,
    sex: raw.sex ?? raw.gender ?? null,
    gender: raw.gender ?? raw.sex ?? null,
    heightCm: height,
    height_cm: height,
    weightKg: weight,
    weight_kg: weight,
    bloodGroup: raw.blood_group ?? raw.bloodGroup ?? raw.blood_type ?? raw.bloodType ?? null,
    blood_group: raw.blood_group ?? raw.bloodGroup ?? raw.blood_type ?? raw.bloodType ?? null,
    bloodType: raw.blood_type ?? raw.bloodType ?? raw.blood_group ?? null,
    blood_type: raw.blood_type ?? raw.bloodType ?? raw.blood_group ?? null,
    medicalConditions: parseList(raw.medical_conditions ?? raw.medicalConditions ?? raw.chronic_conditions),
    medical_conditions: parseList(raw.medical_conditions ?? raw.medicalConditions ?? raw.chronic_conditions),
    medications: parseList(raw.medications ?? raw.current_medications),
    allergies: parseList(raw.allergies),
    previousSurgeries: parseList(raw.previous_surgeries ?? raw.previousSurgeries),
    previous_surgeries: parseList(raw.previous_surgeries ?? raw.previousSurgeries),
    familyHistory: parseList(raw.family_history ?? raw.familyHistory),
    family_history: parseList(raw.family_history ?? raw.familyHistory),
    emergencyContact: raw.emergency_contact ?? raw.emergencyContact ?? null,
    emergency_contact: raw.emergency_contact ?? raw.emergencyContact ?? null,
    emergencyPhone: raw.emergency_phone ?? raw.emergencyPhone ?? null,
    emergency_phone: raw.emergency_phone ?? raw.emergencyPhone ?? null,
    profileCompleted: Boolean(raw.profile_completed ?? raw.profileCompleted ?? raw.is_completed),
    profile_completed: Boolean(raw.profile_completed ?? raw.profileCompleted ?? raw.is_completed),
    is_completed: Boolean(raw.is_completed ?? raw.profile_completed),
    bmi: raw.bmi ?? bmiEval?.bmi ?? null,
    bmiCategory: raw.bmi_category ?? raw.bmiCategory ?? bmiEval?.category ?? null,
    bmi_category: raw.bmi_category ?? raw.bmiCategory ?? bmiEval?.category ?? null,
    age: ageVal,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    updated_at: raw.updated_at ?? raw.updatedAt ?? null,
  }
}
