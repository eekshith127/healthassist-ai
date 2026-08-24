import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  Stethoscope,
  Bell,
  HeartPulse,
  Activity,
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
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-base text-[#111827]">
          <div className="h-7 w-7 rounded-md bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <span>TRISHUL AI</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/assessment">
            <Button size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs gap-1.5 px-2.5 h-8">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Assessment</span>
            </Button>
          </Link>
          <UserButton afterSignOutUrl="/login" />
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-[#4B5563] hover:bg-[#F3F4F6]"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <header
        className={cn(
          'hidden md:flex h-16 bg-white border-b border-[#E5E7EB] items-center justify-between px-8 sticky top-0 z-30 select-none',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <HealthStatusBadge showDetails />
        </div>

        <div className="flex items-center gap-3 relative">
          <Link to="/assessment">
            <Button size="sm" className="gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium h-9 px-3.5">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Start assessment</span>
            </Button>
          </Link>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
              }}
              className="p-2 rounded-md text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] relative transition-colors"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-[#2563EB] rounded-full" />
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#E5E7EB] shadow-elevated z-50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                  <span className="text-xs font-semibold text-[#111827] uppercase tracking-wider">
                    Notifications
                  </span>
                  <span className="text-[11px] text-[#2563EB] font-medium cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-xs space-y-0.5 border border-[#E5E7EB]"
                    >
                      <div className="flex items-center justify-between font-medium text-[#111827]">
                        <span>{n.title}</span>
                        <span className="text-[10px] font-normal text-[#6B7280]">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-[#E5E7EB]" />

          {/* User Profile Button with Clerk */}
          <div className="flex items-center gap-2.5">
            <UserButton
              afterSignOutUrl="/login"
              appearance={{
                elements: {
                  userButtonAvatarBox: 'h-7 w-7 rounded-full border border-[#E5E7EB]',
                },
              }}
            />
            <Link to="/profile" className="text-left hidden lg:block hover:opacity-80 transition-opacity">
              <div className="text-[13px] font-medium leading-tight text-[#111827]">
                {displayName}
              </div>
              <div className="text-[11px] text-[#6B7280] truncate max-w-[130px]">
                {displayEmail}
              </div>
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
