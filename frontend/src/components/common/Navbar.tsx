import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  Stethoscope,
  Bell,
  HeartPulse,
} from 'lucide-react'
import { useUser, UserButton } from '@clerk/clerk-react'
import { Button } from '../ui/button'
import { HealthStatusBadge } from './HealthStatusBadge'
import { cn } from '../../utils/cn'

export interface NavbarProps {
  onToggleSidebar?: () => void
  className?: string
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, className }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useUser()

  const displayName = user?.fullName || user?.firstName || 'Patient'
  const displayEmail = user?.primaryEmailAddress?.emailAddress || 'Authenticated Patient'

  const notifications = [
    {
      id: 1,
      title: 'Triage Summary Available',
      time: '10m ago',
      desc: 'AI Consensus report HA-2026-0818 is ready for download.',
      unread: true,
    },
    {
      id: 2,
      title: 'Upcoming Video Consult',
      time: '1h ago',
      desc: 'Dr. Sarah Jenkins confirmed your consultation for tomorrow at 2:00 PM.',
      unread: true,
    },
    {
      id: 3,
      title: 'Health Profile Synced',
      time: '1d ago',
      desc: 'Vital telemetry from Apple Health synchronized successfully.',
      unread: false,
    },
  ]

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-emerald-600 dark:text-emerald-400">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 rounded-xl">
            <HeartPulse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span>HealthAssist</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/assessment">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 px-2.5">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Triage</span>
            </Button>
          </Link>
          <UserButton afterSignOutUrl="/login" />
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <header
        className={cn(
          'hidden md:flex h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 items-center justify-between px-8 sticky top-0 z-30 transition-all',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <span className="text-slate-400">Environment:</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
              Local Dev
            </span>
          </div>
          <HealthStatusBadge showDetails />
        </div>

        <div className="flex items-center gap-3.5 relative">
          <Link to="/assessment">
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-semibold">
              <Stethoscope className="h-4 w-4" />
              <span>Start AI Assessment</span>
            </Button>
          </Link>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifications
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-colors text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{n.title}</span>
                        <span className="text-[10px] font-normal text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

          {/* User Profile Button with Clerk */}
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/login"
              appearance={{
                elements: {
                  userButtonAvatarBox: 'h-8 w-8 rounded-full border border-emerald-500/30',
                },
              }}
            />
            <Link to="/profile" className="text-left hidden lg:block hover:opacity-80 transition-opacity">
              <div className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                {displayEmail}
              </div>
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
