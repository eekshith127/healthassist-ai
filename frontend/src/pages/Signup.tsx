import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Lock, Mail, User, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react'

export const Signup: React.FC = () => {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('John Doe')
  const [email, setEmail] = useState('john.doe@healthassist.ai')
  const [password, setPassword] = useState('••••••••••••')
  const [bloodType, setBloodType] = useState('O+')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      navigate('/dashboard')
    }, 400)
  }

  return (
    <Card className="w-full shadow-2xl border-slate-200/80 dark:border-slate-800 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold tracking-tight">Create Health Profile</CardTitle>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
            <HeartPulse className="h-5 w-5" />
          </div>
        </div>
        <CardDescription>
          Get instant access to AI clinical triage and verified telehealth physicians
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Full Legal Name
            </label>
            <Input
              id="name"
              placeholder="E.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Blood Group
              </label>
              <Select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                options={[
                  { value: 'O+', label: 'O-Positive (O+)' },
                  { value: 'O-', label: 'O-Negative (O-)' },
                  { value: 'A+', label: 'A-Positive (A+)' },
                  { value: 'A-', label: 'A-Negative (A-)' },
                  { value: 'B+', label: 'B-Positive (B+)' },
                  { value: 'B-', label: 'B-Negative (B-)' },
                  { value: 'AB+', label: 'AB-Positive (AB+)' },
                  { value: 'AB-', label: 'AB-Negative (AB-)' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              By creating an account, you consent to HIPAA medical encryption and agree to HealthAssist's Telehealth Terms of Service.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white"
            isLoading={isSubmitting}
            loadingText="Creating Account..."
          >
            <span>Complete Setup & Enter Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
