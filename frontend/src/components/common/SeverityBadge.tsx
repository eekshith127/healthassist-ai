import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import { cn } from '../../utils/cn'
import { TriageSeverity } from '../../types'

export interface SeverityBadgeProps {
  severity: TriageSeverity | string
  className?: string
  showPulse?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className,
  showPulse = true,
  size = 'md',
}) => {
  const norm = severity.toLowerCase()

  const config = {
    emergency: {
      label: 'Emergency (Immediate 911/ER)',
      shortLabel: 'Emergency',
      bg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
    },
    urgent: {
      label: 'Urgent Care (Within 24 Hours)',
      shortLabel: 'Urgent Care',
      bg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
    },
    'non-urgent': {
      label: 'Non-Urgent (Routine Consultation)',
      shortLabel: 'Non-Urgent',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
    },
    'self-care': {
      label: 'Self-Care & Home Monitoring',
      shortLabel: 'Self-Care',
      bg: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-900',
      dot: 'bg-teal-500',
      icon: AlertCircle,
    },
  }[norm] || {
    label: severity,
    shortLabel: severity,
    bg: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200',
    dot: 'bg-slate-400',
    icon: CheckCircle,
  }

  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-sm transition-all select-none',
        config.bg,
        sizeClasses,
        className
      )}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2">
          {norm === 'emergency' && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                config.dot
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', config.dot)} />
        </span>
      )}
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  )
}
