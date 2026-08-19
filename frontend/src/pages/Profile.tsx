import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { User, Mail, Shield, Bell, Lock, LogOut, Check, Save } from 'lucide-react'

export const Profile: React.FC = () => {
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-600" />
          <span>Account & Security Settings</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal account credentials, communication preferences, and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card / Avatar */}
        <Card className="md:col-span-1 text-center p-6 space-y-4">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl font-bold shadow-md">
            JD
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">John Doe</h3>
            <p className="text-xs text-slate-500">Patient Account #HA-8492</p>
            <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
              Verified Patient
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <Button variant="outline" size="sm" className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </Card>

        {/* Profile Info Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Details</CardTitle>
                <CardDescription>Update your contact and identification details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" defaultValue="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue="+1 (555) 349-9201" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-4">
                <Button type="submit" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs">
                  {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  <span>{saved ? 'Saved' : 'Save Changes'}</span>
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Security & Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span>Security & Credentials</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</div>
                  <div className="text-slate-500">Protect account with SMS/Authenticator code</div>
                </div>
                <Button variant="secondary" size="sm" className="text-xs">
                  Enable
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Password</div>
                  <div className="text-slate-500">Last changed 45 days ago</div>
                </div>
                <Button variant="secondary" size="sm" className="text-xs">
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
