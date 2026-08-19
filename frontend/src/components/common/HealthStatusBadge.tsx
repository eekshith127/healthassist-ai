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
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
        isLoading
          ? 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
          : isError
          ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-400'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300'
      } ${className}`}
      title={isError ? errorMessage || 'Backend Offline' : 'Backend Connected'}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isLoading ? 'bg-slate-400' : isError ? 'bg-rose-400' : 'bg-emerald-400'
          }`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isLoading ? 'bg-slate-500' : isError ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
        ></span>
      </span>

      <span className="flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5" />
        {isLoading ? (
          'Checking API...'
        ) : isError ? (
          <span>Backend Offline</span>
        ) : (
          <span>
            API Online {showDetails && health?.version ? `(v${health.version})` : ''}
          </span>
        )}
      </span>

      {isError && (
        <button
          onClick={() => refetch()}
          className="ml-1 hover:rotate-180 transition-transform duration-300"
          title="Retry Connection"
          type="button"
        >
          <RefreshCw className="h-3 w-3 text-rose-500" />
        </button>
      )}
    </div>
  )
}
