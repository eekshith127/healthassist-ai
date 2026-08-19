import { HealthProfile } from '../types'
import { mockHealthProfile } from './mockData'
import { calculateBMI, calculateAge } from '../utils/bmi'

const LOCAL_STORAGE_KEY = 'healthassist_persistent_profile'
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

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
    sex: raw.sex ?? 'male',
    heightCm: height,
    weightKg: weight,
    bloodGroup: raw.blood_group ?? raw.bloodGroup ?? 'O+',
    medicalConditions: raw.medical_conditions ?? raw.medicalConditions ?? [],
    medications: raw.medications ?? [],
    allergies: raw.allergies ?? [],
    previousSurgeries: raw.previous_surgeries ?? raw.previousSurgeries ?? [],
    familyHistory: raw.family_history ?? raw.familyHistory ?? [],
    profileCompleted: raw.profile_completed ?? raw.profileCompleted ?? true,
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
    date_of_birth: profile.dateOfBirth,
    sex: profile.sex,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    blood_group: profile.bloodGroup,
    medical_conditions: profile.medicalConditions,
    medications: profile.medications,
    allergies: profile.allergies,
    previous_surgeries: profile.previousSurgeries,
    family_history: profile.familyHistory,
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
