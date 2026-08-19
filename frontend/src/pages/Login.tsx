import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Lock, Mail, ArrowRight, Shield } from 'lucide-react'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Placeholder login - navigates to dashboard
    setTimeout(() => {
      setIsSubmitting(false)
      navigate('/dashboard')
    }, 500)
  }

  return (
    <Card className="w-full shadow-xl border-slate-200/80 dark:border-slate-800 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-full text-emerald-600">
            <Shield className="h-5 w-5" />
          </div>
        </div>
        <CardDescription>
          Enter your credentials to access your health records & AI triage
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#forgot" className="text-xs text-emerald-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-500 border border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Demo Mode:</span> Authentication is placeholder-only. Any credentials will proceed to Dashboard.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-600 font-semibold hover:underline">
              Create account
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
