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
  showPulse = false,
  size = 'md',
}) => {
  const norm = severity.toLowerCase()

  const config = {
    emergency: {
      label: 'Emergency',
      shortLabel: 'Emergency',
      bg: 'bg-red-50 text-[#DC2626] border-[#FECACA]',
      dot: 'bg-[#DC2626]',
      icon: ShieldAlert,
    },
    urgent: {
      label: 'Urgent Care',
      shortLabel: 'Urgent',
      bg: 'bg-amber-50 text-[#D97706] border-[#FDE68A]',
      dot: 'bg-[#D97706]',
      icon: AlertTriangle,
    },
    moderate: {
      label: 'Moderate',
      shortLabel: 'Moderate',
      bg: 'bg-amber-50 text-[#D97706] border-[#FDE68A]',
      dot: 'bg-[#D97706]',
      icon: AlertTriangle,
    },
    'non-urgent': {
      label: 'Non-Urgent',
      shortLabel: 'Non-Urgent',
      bg: 'bg-emerald-50 text-[#16A34A] border-[#BBF7D0]',
      dot: 'bg-[#16A34A]',
      icon: CheckCircle,
    },
    'self-care': {
      label: 'Self-Care',
      shortLabel: 'Self-Care',
      bg: 'bg-emerald-50 text-[#16A34A] border-[#BBF7D0]',
      dot: 'bg-[#16A34A]',
      icon: CheckCircle,
    },
    low: {
      label: 'Low Severity',
      shortLabel: 'Low',
      bg: 'bg-emerald-50 text-[#16A34A] border-[#BBF7D0]',
      dot: 'bg-[#16A34A]',
      icon: CheckCircle,
    },
  }[norm] || {
    label: severity,
    shortLabel: severity,
    bg: 'bg-gray-50 text-[#4B5563] border-[#E5E7EB]',
    dot: 'bg-[#9CA3AF]',
    icon: CheckCircle,
  }

  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1 gap-1.5 font-medium',
  }[size]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border select-none transition-colors',
        config.bg,
        sizeClasses,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} />
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  )
}
