export type TriageSeverity = 'emergency' | 'urgent' | 'non-urgent' | 'self-care'

export interface HealthStatus {
  status: string
  service?: string
  version?: string
  environment?: string
  database?: string
}

export interface User {
  id: number
  email: string
  fullName: string
  role: 'patient' | 'doctor' | 'admin'
  avatarUrl?: string
  patientId?: string
  phone?: string
  bloodType?: string
  dateOfBirth?: string
  allergiesCount?: number
  activePrescriptionsCount?: number
}

export interface HealthProfile {
  id?: number
  userId?: number
  user_id?: number
  dateOfBirth?: string
  date_of_birth?: string
  sex?: string
  heightCm?: number
  height_cm?: number
  weightKg?: number
  weight_kg?: number
  bloodGroup?: string
  blood_group?: string
  medicalConditions: string[]
  medical_conditions?: string[]
  medications: string[]
  allergies: string[]
  previousSurgeries: string[]
  previous_surgeries?: string[]
  familyHistory: string[]
  family_history?: string[]
  profileCompleted?: boolean
  profile_completed?: boolean
  bmi?: number
  bmiCategory?: string
  bmi_category?: string
  age?: number
  updatedAt?: string
  updated_at?: string
}

export interface VitalMetric {
  id: string
  title: string
  value: string
  unit: string
  status: 'normal' | 'attention' | 'warning'
  change?: string
  trend?: 'up' | 'down' | 'stable'
  updatedAt: string
  iconName: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribedBy: string
  refillsRemaining: number
  active: boolean
}

export interface Allergy {
  id: string
  substance: string
  reaction: string
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening'
}

export interface AssessmentRecord {
  id: string
  symptoms: string
  triageLevel: TriageSeverity
  aiSummary: string
  differentialDiagnoses: Array<{
    name: string
    probability: number
    description: string
  }>
  consensusScore: number
  modelVotes: {
    geminiMed: number
    medPalm: number
    clinicalGpt: number
  }
  recommendedAction: string
  recommendedSpecialist?: string
  createdAt: string
  status: 'active' | 'resolved' | 'escalated'
  duration?: string
  reportedPainScale?: number
  emergencyRedFlags?: string[]
  selfCareAdvice?: string[]
}

export interface ChatOption {
  id: string
  label: string
  value: string
}

export interface ChatMessageItem {
  id: string
  sender: 'bot' | 'user' | 'system'
  text: string
  timestamp: string
  options?: ChatOption[]
  assessmentResult?: AssessmentRecord
  isTyping?: boolean
  consensusStatus?: string
}

export interface HealthcareProvider {
  id: number
  name: string
  title: string
  specialty: string
  hospital: string
  rating: number
  reviewsCount: number
  availability: string
  experienceYears: number
  imageUrl?: string
  initials: string
  acceptingNewPatients: boolean
  languages: string[]
  telehealthFee: string
  nextSlots: string[]
}

export interface UpcomingAppointment {
  id: string
  providerName: string
  specialty: string
  hospital: string
  date: string
  time: string
  type: 'video' | 'in-person'
  meetingLink?: string
}
