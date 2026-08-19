import * as React from 'react'
import { cn } from '../../utils/cn'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  initials?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'busy' | 'offline' | 'verified'
  variant?: 'circle' | 'rounded'
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  initials = 'HA',
  size = 'md',
  status,
  variant = 'circle',
  className,
  ...props
}) => {
  const sizeMap = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-14 w-14 text-base font-bold',
    xl: 'h-20 w-20 text-xl font-bold',
  }

  const statusSizeMap = {
    xs: 'h-1.5 w-1.5 ring-1',
    sm: 'h-2 w-2 ring-2',
    md: 'h-2.5 w-2.5 ring-2',
    lg: 'h-3.5 w-3.5 ring-2',
    xl: 'h-4 w-4 ring-2',
  }

  const statusColorMap = {
    online: 'bg-emerald-500',
    busy: 'bg-amber-500',
    offline: 'bg-slate-400',
    verified: 'bg-teal-500',
  }

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center select-none overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-medium shadow-sm',
        variant === 'circle' ? 'rounded-full' : 'rounded-2xl',
        sizeMap[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-white dark:ring-slate-900',
            statusSizeMap[size],
            statusColorMap[status]
          )}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
