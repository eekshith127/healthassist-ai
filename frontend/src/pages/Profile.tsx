import React from 'react'
import { useUser, useClerk, UserProfile } from '@clerk/clerk-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { User as UserIcon, LogOut } from 'lucide-react'

export const Profile: React.FC = () => {
  const { user } = useUser()
  const { signOut } = useClerk()

  const displayName = user?.fullName || user?.firstName || 'Patient'
  const displayEmail = user?.primaryEmailAddress?.emailAddress || 'user@healthassist.care'
  const clerkUserId = user?.id || 'clerk_user'

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-emerald-600" />
          <span>Account & Security Settings</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your authenticated Clerk identity, security credentials, and communication settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Summary Card */}
        <Card className="lg:col-span-1 text-center p-6 space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full overflow-hidden border-2 border-emerald-500/40 shadow-md">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-bold">
                {displayName.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{displayName}</h3>
            <p className="text-xs text-slate-500">{displayEmail}</p>
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
              Clerk Authenticated
            </div>
          </div>

          <div className="text-left text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border space-y-1">
            <div className="text-slate-400 font-mono text-[10px] uppercase">Clerk Subject ID</div>
            <div className="font-mono text-slate-800 dark:text-slate-200 text-[11px] break-all">
              {clerkUserId}
            </div>
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out of HealthAssist</span>
            </Button>
          </div>
        </Card>

        {/* Embedded Clerk User Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-2 sm:p-4 overflow-hidden">
            <UserProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full shadow-none',
                  card: 'shadow-none border-0 bg-transparent p-0',
                  navbar: 'hidden',
                  headerTitle: 'text-lg font-bold text-slate-900 dark:text-white',
                },
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile
