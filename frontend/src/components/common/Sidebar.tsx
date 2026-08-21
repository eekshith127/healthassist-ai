import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Stethoscope,
  CreditCard,
  Clock,
  UserCheck,
  User,
  HeartPulse,
  ShieldCheck,
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
  { name: 'AI Health Assessment', path: '/assessment', icon: Stethoscope, badge: 'Live AI' },
  { name: 'Assessment History', path: '/history', icon: Clock },
  { name: 'My Health Card', path: '/health-card', icon: CreditCard },
  { name: 'Healthcare Providers', path: '/providers', icon: UserCheck },
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Branding */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 group"
              onClick={onClose}
            >
              <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-md shadow-emerald-500/20 text-white transition-transform group-hover:scale-105">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                  HealthAssist
                </h1>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Clinical AI Telemedicine
                </p>
              </div>
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close navigation sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110 text-slate-500 group-hover:text-emerald-600 dark:text-slate-400 dark:group-hover:text-emerald-400" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Multi-LLM Protocol</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Safety-guarded medical insights with clinician handoff.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
              <HealthStatusBadge />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
