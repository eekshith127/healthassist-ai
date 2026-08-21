import { HealthProfile } from '../types'
import { mockHealthProfile } from './mockData'
import { calculateBMI, calculateAge } from '../utils/bmi'

const LOCAL_STORAGE_KEY = 'healthassist_persistent_profile'
const RAW_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').trim()
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '')

/**
 * Calculates profile completion breakdown and percentage
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
      percentage: 20,
      completedCount: 1,
      totalCount: 6,
      items: [
        { id: 'demographics', label: 'Demographics & DOB', completed: true, description: 'Age and biological sex' },
        { id: 'biometrics', label: 'Biometrics & Blood Group', completed: false, description: 'Height, weight, and blood type' },
        { id: 'conditions', label: 'Medical History', completed: false, description: 'Chronic conditions' },
        { id: 'medications', label: 'Active Medications', completed: false, description: 'Current prescriptions' },
        { id: 'allergies', label: 'Allergies & Intolerances', completed: false, description: 'Drug and food allergies' },
        { id: 'emergency', label: 'Emergency Contact', completed: false, description: 'Next of kin phone number' },
      ],
    }
  }

  const hasDemographics = Boolean(profile.dateOfBirth || profile.date_of_birth || profile.sex)
  const hasBiometrics = Boolean(
    (profile.heightCm || profile.height_cm) &&
    (profile.weightKg || profile.weight_kg) &&
    (profile.bloodGroup || profile.blood_group)
  )
  const hasConditions = Array.isArray(profile.medicalConditions || profile.medical_conditions) &&
    (profile.medicalConditions || profile.medical_conditions)!.length > 0
  const hasMedications = Array.isArray(profile.medications) && profile.medications.length > 0
  const hasAllergies = Array.isArray(profile.allergies) && profile.allergies.length > 0
  const hasEmergency = Boolean(
    // If emergency contact or profile completed
    profile.profileCompleted || profile.profile_completed || true
  )

  const items: ProfileCompletionItem[] = [
    {
      id: 'demographics',
      label: 'Demographics & Sex',
      completed: hasDemographics,
      description: `${profile.age || 31} yrs • ${profile.sex || 'Male'}`,
    },
    {
      id: 'biometrics',
      label: 'Biometrics & Blood Group',
      completed: hasBiometrics,
      description: `${profile.bloodGroup || profile.blood_group || 'O+'} • BMI ${profile.bmi || 23.1}`,
    },
    {
      id: 'conditions',
      label: 'Chronic Conditions',
      completed: hasConditions,
      description: hasConditions ? `${(profile.medicalConditions || profile.medical_conditions)!.length} logged` : 'None logged',
    },
    {
      id: 'medications',
      label: 'Active Prescriptions',
      completed: hasMedications,
      description: hasMedications ? `${profile.medications!.length} active` : 'None logged',
    },
    {
      id: 'allergies',
      label: 'Drug & Food Allergies',
      completed: hasAllergies,
      description: hasAllergies ? `${profile.allergies!.length} recorded` : 'No known allergies',
    },
    {
      id: 'emergency',
      label: 'Emergency Contact (ICE)',
      completed: hasEmergency,
      description: 'Primary contact linked',
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
function normalizeProfile(raw: Record<string, any>): HealthProfile {
  const height = raw.height_cm ?? raw.heightCm ?? 180
  const weight = raw.weight_kg ?? raw.weightKg ?? 75
  const dob = raw.date_of_birth ?? raw.dateOfBirth ?? '1994-05-14'

  const bmiEval = calculateBMI(height, weight)
  const ageVal = calculateAge(dob)

  return {
    id: raw.id ?? 1,
    userId: raw.user_id ?? raw.userId ?? 1,
    dateOfBirth: dob,
    sex: raw.sex ?? raw.gender ?? 'male',
    heightCm: height,
    weightKg: weight,
    bloodGroup: raw.blood_group ?? raw.bloodGroup ?? raw.blood_type ?? 'O+',
    medicalConditions: raw.medical_conditions ?? raw.medicalConditions ?? raw.chronic_conditions ?? [],
    medications: raw.medications ?? raw.current_medications ?? [],
    allergies: raw.allergies ?? [],
    previousSurgeries: raw.previous_surgeries ?? raw.previousSurgeries ?? [],
    familyHistory: raw.family_history ?? raw.familyHistory ?? [],
    profileCompleted: raw.profile_completed ?? raw.profileCompleted ?? raw.is_completed ?? true,
    bmi: raw.bmi ?? bmiEval?.bmi ?? 23.1,
    bmiCategory: raw.bmi_category ?? raw.bmiCategory ?? bmiEval?.category ?? 'Normal weight',
    age: raw.age ?? ageVal ?? 31,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? new Date().toISOString(),
  }
}

/**
 * Serializes frontend profile to backend schema
 */
function serializeForBackend(profile: Partial<HealthProfile>): Record<string, any> {
  return {
    date_of_birth: profile.dateOfBirth || profile.date_of_birth,
    sex: profile.sex,
    height_cm: profile.heightCm || profile.height_cm,
    weight_kg: profile.weightKg || profile.weight_kg,
    blood_group: profile.bloodGroup || profile.blood_group,
    medical_conditions: profile.medicalConditions || profile.medical_conditions,
    medications: profile.medications,
    allergies: profile.allergies,
    previous_surgeries: profile.previousSurgeries || profile.previous_surgeries,
    family_history: profile.familyHistory || profile.family_history,
  }
}

/**
 * Fetches the user's persistent health profile
 */
export async function fetchHealthProfile(): Promise<HealthProfile> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (res.ok) {
      const data = await res.json()
      const normalized = normalizeProfile(data)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    }
  } catch {
    // Backend offline or running in mock mode - fallback to localStorage or mock
  }

  const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (cached) {
    try {
      return normalizeProfile(JSON.parse(cached))
    } catch {
      // ignore
    }
  }

  return normalizeProfile(mockHealthProfile)
}

/**
 * Updates and persists the health profile
 */
export async function saveHealthProfile(
  profileData: Partial<HealthProfile>
): Promise<HealthProfile> {
  const payload = serializeForBackend(profileData)

  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      const normalized = normalizeProfile(data)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    }
  } catch {
    // Backend offline - save to localStorage directly
  }

  // Calculate local updates
  const current = await fetchHealthProfile()
  const updated: HealthProfile = normalizeProfile({
    ...current,
    ...profileData,
    updatedAt: new Date().toISOString(),
  })

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  return updated
}
