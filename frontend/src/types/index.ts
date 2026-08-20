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
  role?: 'patient' | 'doctor' | 'admin'
  patientId?: string
  avatarUrl?: string
  phone?: string
  bloodType?: string
  dateOfBirth?: string
  allergiesCount?: number
  activePrescriptionsCount?: number
}

export interface UserMe {
  id: number
  clerk_user_id: string
  name?: string | null
  email: string
  fullName?: string
  role?: 'patient' | 'doctor' | 'admin'
  avatarUrl?: string
  patientId?: string
  phone?: string
  bloodType?: string
  dateOfBirth?: string
  allergiesCount?: number
  activePrescriptionsCount?: number
  profile_completed: boolean
  created_at: string
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
  medicalConditions?: string[]
  medical_conditions?: string[]
  medications?: string[]
  allergies?: string[]
  previousSurgeries?: string[]
  previous_surgeries?: string[]
  familyHistory?: string[]
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

export interface HealthProfileData {
  id?: number
  user_id?: number
  age?: number | string | null
  gender?: string | null
  blood_type?: string | null
  allergies?: string | null
  chronic_conditions?: string | null
  current_medications?: string | null
  emergency_contact?: string | null
  emergency_phone?: string | null
  is_completed?: boolean
  created_at?: string
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

export interface DifferentialDiagnosis {
  name: string
  probability: number
  description: string
}

export interface ModelVotes {
  geminiMed: number
  medPalm: number
  clinicalGpt: number
}

export interface AssessmentRecord {
  id: number | string
  user_id?: number
  symptoms: string
  duration?: string | null
  severity?: string | null
  triage_level?: string
  triageLevel?: TriageSeverity
  ai_summary?: string | null
  aiSummary?: string
  differentialDiagnoses?: DifferentialDiagnosis[]
  consensusScore?: number
  consensus_score?: number | null
  modelVotes?: ModelVotes
  safety_checked?: string
  recommended_specialist?: string | null
  recommendedSpecialist?: string
  recommendedAction?: string
  status?: 'active' | 'resolved' | 'escalated'
  reportedPainScale?: number
  emergencyRedFlags?: string[]
  selfCareAdvice?: string[]
  createdAt?: string
  created_at?: string
}

export interface AssessmentCreatePayload {
  symptoms: string
  duration?: string
  severity?: string
  triage_level?: string
  ai_summary?: string
  consensus_score?: number
  safety_checked?: string
  recommended_specialist?: string
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
  status?: 'sending' | 'sent' | 'error'
  error?: string
  retryPayload?: string
  step?: number
}

export interface AssessmentMessagePayload {
  message: string
  sender?: string
  step?: number
  duration?: string
  severity?: string
}

export interface AssessmentMessageResponse {
  id: string
  assessment_id: string | number
  sender: 'bot' | 'user'
  message: string
  timestamp: string
  step: number
  options?: ChatOption[]
  assessment_summary?: Partial<AssessmentRecord>
  status: string
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
  experienceYears?: number
  imageUrl?: string
  initials?: string
  acceptingNewPatients: boolean
  languages?: string[]
  telehealthFee?: string
  nextSlots?: string[]
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
