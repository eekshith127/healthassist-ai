import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AuthVisualPanel } from '../components/auth/AuthVisualPanel'

export const AuthLayout: React.FC = () => {
  const location = useLocation()
  const isSignup = location.pathname.includes('signup')

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-[#F9FAFB] font-sans antialiased text-[#111827] relative overflow-x-hidden">
      {/* Extremely subtle ambient lighting */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-100/40 via-emerald-50/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Main Split-Screen Authentication Container Card */}
      <div className="w-full max-w-5xl bg-white border border-[#E5E7EB] rounded-2xl sm:rounded-3xl shadow-elevated overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 animate-in fade-in zoom-in-95 duration-200 min-h-[620px]">
        {/* Left Branded Medical Intelligence Panel */}
        <div className="lg:col-span-6 flex flex-col">
          <AuthVisualPanel mode={isSignup ? 'signup' : 'login'} />
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-center relative">
          <div className="w-full max-w-[420px] mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
