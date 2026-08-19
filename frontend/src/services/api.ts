import axios from 'axios'
import type {
  HealthStatus,
  UserMe,
  HealthProfileData,
  AssessmentRecord,
  AssessmentCreatePayload,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Helper to create auth header
const authHeaders = (token?: string | null) => {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

export const healthApi = {
  getHealth: async (): Promise<HealthStatus> => {
    const response = await apiClient.get<HealthStatus>('/health')
    return response.data
  },
}

export const meApi = {
  getMe: async (token?: string | null): Promise<UserMe> => {
    const response = await apiClient.get<UserMe>('/me', authHeaders(token))
    return response.data
  },
}

export const profileApi = {
  getProfile: async (token?: string | null): Promise<HealthProfileData | null> => {
    const response = await apiClient.get<HealthProfileData | null>('/profile', authHeaders(token))
    return response.data
  },
  updateProfile: async (
    data: Partial<HealthProfileData>,
    token?: string | null
  ): Promise<HealthProfileData> => {
    const response = await apiClient.put<HealthProfileData>('/profile', data, authHeaders(token))
    return response.data
  },
}

export const assessmentApi = {
  getAssessments: async (token?: string | null): Promise<AssessmentRecord[]> => {
    const response = await apiClient.get<AssessmentRecord[]>('/assessments', authHeaders(token))
    return response.data
  },
  getAssessment: async (id: number, token?: string | null): Promise<AssessmentRecord> => {
    const response = await apiClient.get<AssessmentRecord>(`/assessments/${id}`, authHeaders(token))
    return response.data
  },
  createAssessment: async (
    data: AssessmentCreatePayload,
    token?: string | null
  ): Promise<AssessmentRecord> => {
    const response = await apiClient.post<AssessmentRecord>('/assessments', data, authHeaders(token))
    return response.data
  },
}

export default apiClient
