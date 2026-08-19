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
}

export interface HealthMetric {
  id: string
  title: string
  value: string
  unit: string
  status: 'normal' | 'attention' | 'warning'
  change?: string
  updatedAt: string
}

export interface AssessmentRecord {
  id: number
  symptoms: string
  triageLevel: 'emergency' | 'urgent' | 'non-urgent' | 'self-care'
  aiSummary: string
  consensusScore: number
  createdAt: string
  recommendedSpecialist?: string
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
  imageUrl: string
  acceptingNewPatients: boolean
}
