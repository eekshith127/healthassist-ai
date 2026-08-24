import axios from 'axios'
import type {
  HealthStatus,
  UserMe,
  HealthProfileData,
  AssessmentRecord,
  AssessmentCreatePayload,
  AssessmentMessagePayload,
  AssessmentMessageResponse,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
})

// Helper to attach authorization header
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
  getAssessment: async (id: number | string, token?: string | null): Promise<AssessmentRecord> => {
    const response = await apiClient.get<AssessmentRecord>(`/assessments/${id}`, authHeaders(token))
    return response.data
  },
  getAssessmentMessages: async (
    id: number | string,
    token?: string | null
  ): Promise<Array<{ id: string; sender: 'bot' | 'user'; text: string; timestamp: string }>> => {
    const response = await apiClient.get<Array<{ id: string; sender: 'bot' | 'user'; text: string; timestamp: string }>>(
      `/assessments/${id}/messages`,
      authHeaders(token)
    )
    return response.data
  },
  createAssessment: async (
    data: AssessmentCreatePayload,
    token?: string | null
  ): Promise<AssessmentRecord> => {
    const response = await apiClient.post<AssessmentRecord>('/assessments', data, authHeaders(token))
    return response.data
  },
  sendAssessmentMessage: async (
    assessmentId: string | number,
    payload: AssessmentMessagePayload,
    token?: string | null
  ): Promise<AssessmentMessageResponse> => {
    const response = await apiClient.post<AssessmentMessageResponse>(
      `/assessments/${assessmentId}/messages`,
      payload,
      authHeaders(token)
    )
    return response.data
  },
  analyzeAssessment: async (
    assessmentId: string | number,
    token?: string | null
  ): Promise<any> => {
    const response = await apiClient.post(
      `/assessments/${assessmentId}/analyze`,
      {},
      authHeaders(token)
    )
    return response.data
  },
}

export const healthCardApi = {
  getShare: async (token?: string | null): Promise<HealthCardShareInfo> => {
    const response = await apiClient.get<HealthCardShareInfo>('/health-card/share', authHeaders(token))
    return response.data
  },
  generateShare: async (token?: string | null): Promise<HealthCardShareInfo> => {
    const response = await apiClient.post<HealthCardShareInfo>('/health-card/share', {}, authHeaders(token))
    return response.data
  },
  revokeShare: async (token?: string | null): Promise<{ message: string; revoked: boolean }> => {
    const response = await apiClient.post<{ message: string; revoked: boolean }>(
      '/health-card/share/revoke',
      {},
      authHeaders(token)
    )
    return response.data
  },
  getPublicCard: async (shareToken: string): Promise<PublicHealthCardData> => {
    const response = await apiClient.get<PublicHealthCardData>(`/health-card/public/${shareToken}`)
    return response.data
  },
}

export default apiClient

