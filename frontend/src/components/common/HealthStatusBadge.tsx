import React from 'react'
import { useHealthCheck } from '../../hooks/useHealthCheck'
import { Activity, RefreshCw } from 'lucide-react'

interface HealthStatusBadgeProps {
  showDetails?: boolean
  className?: string
}

export const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({
  showDetails = false,
  className = '',
}) => {
  const { health, isLoading, isError, errorMessage, refetch } = useHealthCheck(15000)

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-[#4B5563] ${className}`}
      title={isError ? errorMessage || 'Backend Offline' : 'Backend Connected'}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full shrink-0 ${
          isLoading
            ? 'bg-[#9CA3AF]'
            : isError
            ? 'bg-[#DC2626]'
            : 'bg-[#16A34A]'
        }`}
      />
      <span className="font-medium text-[#374151]">
        {isLoading ? (
          'Checking API...'
        ) : isError ? (
          <span className="text-[#DC2626]">Offline</span>
        ) : (
          <span>
            API Online {showDetails && health?.version ? `v${health.version}` : ''}
          </span>
        )}
      </span>

      {isError && (
        <button
          onClick={() => refetch()}
          className="ml-0.5 text-[#6B7280] hover:text-[#111827] transition-colors"
          title="Retry Connection"
          type="button"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
