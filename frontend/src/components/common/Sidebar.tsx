import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Stethoscope,
  CreditCard,
  Clock,
  User,
  Activity,
  X,
} from 'lucide-react'
import { HealthStatusBadge } from './HealthStatusBadge'
import { cn } from '../../utils/cn'

export interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Health Assessment', path: '/assessment', icon: Stethoscope },
  { name: 'Assessment History', path: '/history', icon: Clock },
  { name: 'My Health Card', path: '/health-card', icon: CreditCard },
  { name: 'Profile', path: '/profile', icon: User },
]

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  className,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 md:static shrink-0 select-none',
          isOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-16 px-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5"
              onClick={onClose}
            >
              <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                <Activity className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold tracking-tight text-[#111827] leading-tight">
                  TRISHUL AI
                </span>
                <span className="text-[10px] font-medium tracking-wide text-[#6B7280]">
                  Clinical Intelligence
                </span>
              </div>
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-md text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                aria-label="Close navigation sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 relative',
                      isActive
                        ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                        : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#E5E7EB]">
            <HealthStatusBadge />
          </div>
        </div>
      </aside>
    </>
  )
}
