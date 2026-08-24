import React from 'react'
import { Link } from 'react-router-dom'
import { useUser, useClerk, UserProfile } from '@clerk/clerk-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { LogOut, FileHeart } from 'lucide-react'

export const Profile: React.FC = () => {
  const { user } = useUser()
  const { signOut } = useClerk()

  const displayName = user?.fullName || user?.firstName || 'Patient'
  const displayEmail = user?.primaryEmailAddress?.emailAddress || 'user@healthassist.care'
  const clerkUserId = user?.id || 'clerk_user'

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#111827] leading-tight">
          Account Settings
        </h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Manage your authenticated identity, credentials, and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Summary Card */}
        <Card className="lg:col-span-1 text-center p-6 space-y-4 border border-[#E5E7EB] bg-white rounded-xl shadow-subtle">
          <div className="mx-auto h-16 w-16 rounded-full overflow-hidden border border-[#E5E7EB]">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xl font-semibold">
                {displayName.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-base text-[#111827]">{displayName}</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">{displayEmail}</p>
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-medium border border-[#DBEAFE]">
              Clerk Authenticated
            </div>
          </div>

          <div className="text-left text-xs bg-[#F9FAFB] p-2.5 rounded-lg border border-[#E5E7EB] space-y-1">
            <div className="text-[#6B7280] font-mono text-[10px] uppercase">User ID</div>
            <div className="font-mono text-[#111827] text-[11px] break-all">
              {clerkUserId}
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
            <Link to="/health-profile" className="block w-full">
              <Button
                size="sm"
                className="w-full text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white gap-1.5 h-8"
              >
                <FileHeart className="h-3.5 w-3.5" />
                <span>Edit Health Profile</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="w-full text-xs text-[#DC2626] hover:text-[#B91C1C] hover:bg-red-50 gap-1.5 h-8 border-[#E5E7EB]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </Button>
          </div>
        </Card>

        {/* Embedded Clerk User Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 sm:p-6 overflow-hidden border border-[#E5E7EB] bg-white rounded-xl shadow-subtle">
            <UserProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full shadow-none',
                  card: 'shadow-none border-0 bg-transparent p-0',
                  navbar: 'hidden',
                  headerTitle: 'text-base font-semibold text-[#111827]',
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
