import { useState, useEffect, useCallback } from 'react'
import { healthApi } from '../services/api'
import type { HealthStatus } from '../types'

interface UseHealthCheckReturn {
  health: HealthStatus | null
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  refetch: () => Promise<void>
}

export function useHealthCheck(pollIntervalMs?: number): UseHealthCheckReturn {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      setIsLoading(true)
      setIsError(false)
      setErrorMessage(null)
      const data = await healthApi.getHealth()
      setHealth(data)
    } catch (err: any) {
      setIsError(true)
      const msg = err.response?.data?.detail || err.message || 'Unable to connect to backend'
      setErrorMessage(msg)
      setHealth(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()

    if (pollIntervalMs && pollIntervalMs > 0) {
      const interval = setInterval(fetchHealth, pollIntervalMs)
      return () => clearInterval(interval)
    }
  }, [fetchHealth, pollIntervalMs])

  return { health, isLoading, isError, errorMessage, refetch: fetchHealth }
}
