import React, { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Stethoscope,
  FileHeart,
  CreditCard,
  Clock,
  UserCheck,
  User,
  Menu,
  X,
  HeartPulse,
  Bell,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { HealthStatusBadge } from '../components/common/HealthStatusBadge'
import { Button } from '../components/ui/button'

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assessment', path: '/assessment', icon: Stethoscope, badge: 'AI' },
  { name: 'Health Profile', path: '/health-profile', icon: FileHeart },
  { name: 'Digital Health Card', path: '/health-card', icon: CreditCard },
  { name: 'History & Reports', path: '/history', icon: Clock },
  { name: 'Care Providers', path: '/providers', icon: UserCheck },
  { name: 'My Profile', path: '/profile', icon: User },
]

export const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-emerald-600 dark:text-emerald-400">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 rounded-lg">
            <HeartPulse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span>HealthAssist</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Branding */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 group"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-md shadow-emerald-500/20 text-white transition-transform group-hover:scale-105">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                  HealthAssist
                </h1>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  AI Telemedicine Platform
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
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
                <span>Multi-LLM Consensus</span>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="hidden md:flex h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-slate-500">
              <span className="text-slate-400">Environment:</span> Local Dev
            </div>
            <HealthStatusBadge showDetails />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/assessment">
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Stethoscope className="h-4 w-4" />
                <span>Start Assessment</span>
              </Button>
            </Link>

            <button
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 relative"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            <Link
              to="/profile"
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                JD
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">
                  John Doe
                </div>
                <div className="text-[10px] text-slate-500">Patient #HA-8492</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
