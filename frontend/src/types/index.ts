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
  fullName?: string
  name?: string
  role?: 'patient' | 'doctor' | 'admin'
  patientId?: string
  avatarUrl?: string
  phone?: string
  bloodType?: string
  dateOfBirth?: string
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
  profile_completed: boolean
  created_at: string
}

export interface HealthProfile {
  id?: number | null
  userId?: number | null
  user_id?: number | null
  dateOfBirth?: string | null
  date_of_birth?: string | null
  sex?: string | null
  gender?: string | null
  heightCm?: number | null
  height_cm?: number | null
  weightKg?: number | null
  weight_kg?: number | null
  bloodGroup?: string | null
  blood_group?: string | null
  bloodType?: string | null
  blood_type?: string | null
  medicalConditions?: string[]
  medical_conditions?: string[]
  chronicConditions?: string | null
  chronic_conditions?: string | null
  medications?: string[]
  currentMedications?: string | null
  current_medications?: string | null
  allergies?: string[]
  previousSurgeries?: string[]
  previous_surgeries?: string[]
  familyHistory?: string[]
  family_history?: string[]
  emergencyContact?: string | null
  emergency_contact?: string | null
  emergencyPhone?: string | null
  emergency_phone?: string | null
  profileCompleted?: boolean
  profile_completed?: boolean
  is_completed?: boolean
  bmi?: number | null
  bmiCategory?: string | null
  bmi_category?: string | null
  age?: number | null
  updatedAt?: string | null
  updated_at?: string | null
}

export interface HealthProfileData {
  id?: number | null
  user_id?: number | null
  age?: number | null
  gender?: string | null
  sex?: string | null
  date_of_birth?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  blood_type?: string | null
  blood_group?: string | null
  allergies?: string[] | string | null
  chronic_conditions?: string | null
  medical_conditions?: string[] | string | null
  current_medications?: string | null
  medications?: string[] | string | null
  previous_surgeries?: string[] | string | null
  family_history?: string[] | string | null
  emergency_contact?: string | null
  emergency_phone?: string | null
  bmi?: number | null
  bmi_category?: string | null
  is_completed?: boolean
  profile_completed?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface DifferentialDiagnosis {
  name: string
  probability: number
  description: string
}

export interface ModelConditionItem {
  name: string
  score: number
  supporting_factors?: string[]
  contradicting_factors?: string[]
}

export interface ModelAssessmentData {
  model_id?: string
  model_name?: string
  display_name?: string
  provider?: string
  possible_conditions?: ModelConditionItem[]
  severity?: string
  recommended_specialty?: string
  missing_information?: string[]
  clinical_reasoning?: string
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
  modelAgreement?: string
  model_agreement?: string
  modelAssessments?: Record<string, ModelAssessmentData>
  model_assessments?: Record<string, ModelAssessmentData>
  disagreements?: string[]
  whyConsidered?: string
  otherPossibilities?: string[]
  safety_checked?: string
  recommended_specialist?: string | null
  recommendedSpecialist?: string
  recommendedAction?: string
  recommended_next_step?: string
  status?: 'active' | 'resolved' | 'escalated'
  reportedPainScale?: number
  emergencyRedFlags?: string[]
  selfCareAdvice?: string[]
  disclaimer?: string
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
  final_assessment?: any
  finalAssessment?: any
  status: string
}

export interface HealthCardShareInfo {
  token: string | null
  is_active: boolean
  created_at?: string | null
  expires_at?: string | null
  revoked_at?: string | null
  qr_url?: string | null
}

export interface PublicHealthCardData {
  patient_name: string
  patient_identifier: string
  age?: number | null
  sex?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  bmi?: number | null
  bmi_category?: string | null
  blood_group?: string | null
  allergies: string[]
  medical_conditions: string[]
  medications: string[]
  emergency_contact?: string | null
  emergency_phone?: string | null
  emergency_phone_dial?: string | null
  national_emergency_dispatch: string
  national_emergency_dispatch_dial: string
  poison_control_centre: string
  poison_control_centre_dial: string
  poison_control_name: string
  created_at?: string | null
  updated_at?: string | null
  disclaimer: string
}

