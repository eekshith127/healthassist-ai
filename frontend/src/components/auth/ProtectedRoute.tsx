import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { meApi } from '../../services/api'
import { SessionVerification } from './SessionVerification'

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
      <SessionVerification
        isAuthLoaded={isLoaded}
        isSignedIn={Boolean(isSignedIn)}
        isSyncingProfile={isSyncing}
        profileCompleted={profileCompleted}
      />
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
