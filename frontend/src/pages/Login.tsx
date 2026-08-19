import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Lock, Mail, ArrowRight, Shield, User, Stethoscope } from 'lucide-react'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('john.doe@healthassist.ai')
  const [password, setPassword] = useState('••••••••••••')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      navigate('/dashboard')
    }, 400)
  }

  const handleQuickLogin = (role: 'patient' | 'doctor') => {
    if (role === 'patient') {
      setEmail('john.doe@healthassist.ai')
    } else {
      setEmail('dr.jenkins@metrohealth.org')
    }
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      navigate('/dashboard')
    }, 300)
  }

  return (
    <Card className="w-full shadow-2xl border-slate-200/80 dark:border-slate-800 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
            <Shield className="h-5 w-5" />
          </div>
        </div>
        <CardDescription>
          Access your HIPAA-encrypted health records and AI triage console
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Quick Demo Login Presets */}
          <div className="space-y-1.5 pb-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              1-Click Demo Accounts:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('patient')}
                className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 text-left text-xs transition-all flex items-center gap-2 group"
              >
                <div className="p-1 rounded-lg bg-emerald-600 text-white group-hover:scale-105 transition-transform">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950 dark:text-emerald-200">Patient Demo</div>
                  <div className="text-[10px] text-slate-500">John Doe</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('doctor')}
                className="p-2.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/60 text-left text-xs transition-all flex items-center gap-2 group"
              >
                <div className="p-1 rounded-lg bg-teal-600 text-white group-hover:scale-105 transition-transform">
                  <Stethoscope className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-bold text-teal-950 dark:text-teal-200">Clinician Demo</div>
                  <div className="text-[10px] text-slate-500">Dr. Sarah Jenkins</div>
                </div>
              </button>
            </div>
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <a href="#forgot" className="text-xs text-emerald-600 hover:underline">
                Forgot password?
              </a>
            </div>
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

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-500 border border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Demo Environment:
            </span>{' '}
            Authentication is preloaded with mock healthcare profiles. Click sign in to continue.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white"
            isLoading={isSubmitting}
            loadingText="Authenticating..."
          >
            <span>Sign In to HealthAssist</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-600 font-semibold hover:underline">
              Create patient account
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
