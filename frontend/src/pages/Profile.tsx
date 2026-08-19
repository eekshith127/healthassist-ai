import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User as UserIcon,
  Lock,
  LogOut,
  Check,
  Save,
  Smartphone,
  Watch,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar } from '../components/ui/avatar'
import { mockCurrentUser } from '../services/mockData'

export const Profile: React.FC = () => {
  const [saved, setSaved] = useState(false)
  const [twoFaEnabled, setTwoFaEnabled] = useState(true)
  const [appleHealthConnected, setAppleHealthConnected] = useState(true)
  const [garminConnected, setGarminConnected] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-emerald-600" />
          <span>Account & Security Settings</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your credentials, connected biometric devices, communication preferences, and HIPAA privacy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card / Avatar */}
        <Card className="md:col-span-1 text-center p-6 space-y-4 h-fit">
          <div className="flex justify-center">
            <Avatar initials="JD" size="xl" status="verified" />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {mockCurrentUser.fullName}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {mockCurrentUser.patientId}</p>
            <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
              Verified Patient
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Account Type:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Patient SaaS</span>
            </div>
            <div className="flex justify-between">
              <span>Member Since:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Jan 2025</span>
            </div>
            <div className="flex justify-between">
              <span>Security Level:</span>
              <span className="font-bold text-emerald-600">HIPAA 2FA Active</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 gap-1.5 font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Profile Info & Security Forms */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Contact Details</CardTitle>
                <CardDescription>Update your identification and communication details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Legal Name
                    </label>
                    <Input defaultValue={mockCurrentUser.fullName} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Phone Number
                    </label>
                    <Input defaultValue={mockCurrentUser.phone} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <Input type="email" defaultValue={mockCurrentUser.email} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t border-slate-100 dark:border-slate-800 p-4">
                <Button type="submit" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                  {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  <span>{saved ? 'Changes Saved' : 'Save Details'}</span>
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Connected Wearables & Devices */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Watch className="h-4 w-4 text-emerald-600" />
                <span>Connected Biometric Wearables</span>
              </CardTitle>
              <CardDescription>
                Continuous heart rate, SpO2, and sleep telemetry for automated triage baseline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Smartphone className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Apple HealthKit</div>
                    <div className="text-slate-500">Syncs Heart Rate, Resting Vitals, SpO2, and Sleep</div>
                  </div>
                </div>
                <Button
                  variant={appleHealthConnected ? 'subtle' : 'outline'}
                  size="sm"
                  onClick={() => setAppleHealthConnected(!appleHealthConnected)}
                  className="text-xs"
                >
                  {appleHealthConnected ? 'Connected' : 'Connect'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Watch className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Garmin Health API</div>
                    <div className="text-slate-500">Continuous telemetry & HRV analysis</div>
                  </div>
                </div>
                <Button
                  variant={garminConnected ? 'subtle' : 'outline'}
                  size="sm"
                  onClick={() => setGarminConnected(!garminConnected)}
                  className="text-xs"
                >
                  {garminConnected ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security & Authentication */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span>Security & Credentials</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Two-Factor Authentication (2FA)
                  </div>
                  <div className="text-slate-500">Authenticator app & SMS security prompts</div>
                </div>
                <Button
                  variant={twoFaEnabled ? 'subtle' : 'outline'}
                  size="sm"
                  onClick={() => setTwoFaEnabled(!twoFaEnabled)}
                  className="text-xs"
                >
                  {twoFaEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Password</div>
                  <div className="text-slate-500">Last changed 45 days ago</div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
