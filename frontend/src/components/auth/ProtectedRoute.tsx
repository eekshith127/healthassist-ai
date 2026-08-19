import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { meApi } from '../../services/api'
import { HeartPulse, Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const location = useLocation()
  const [profileChecked, setProfileChecked] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkProfileStatus = async () => {
      if (!isLoaded || !isSignedIn) {
        if (isMounted) setProfileChecked(true)
        return
      }

      try {
        setIsSyncing(true)
        const token = await getToken()
        const me = await meApi.getMe(token)
        if (isMounted) {
          setProfileCompleted(me.profile_completed)
          setProfileChecked(true)
        }
      } catch (err) {
        console.error('Error syncing authenticated user with backend:', err)
        // Even if backend call has an error, allow navigation to prevent hard lockouts
        if (isMounted) {
          setProfileCompleted(true)
          setProfileChecked(true)
        }
      } finally {
        if (isMounted) setIsSyncing(false)
      }
    }

    checkProfileStatus()

    return () => {
      isMounted = false
    }
  }, [isLoaded, isSignedIn, getToken, location.pathname])

  if (!isLoaded || (isSignedIn && !profileChecked && isSyncing)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl text-emerald-600 animate-pulse">
            <HeartPulse className="h-10 w-10" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <span>Verifying HealthAssist Session...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // If user has not completed health profile and is not on /health-profile, redirect them
  if (
    profileCompleted === false &&
    location.pathname !== '/health-profile'
  ) {
    return <Navigate to="/health-profile" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
