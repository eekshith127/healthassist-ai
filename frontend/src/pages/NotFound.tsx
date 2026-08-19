import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { HeartPulse, Home } from 'lucide-react'

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-full text-emerald-600">
        <HeartPulse className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">404</h1>
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        The health record or route you requested could not be located.
      </p>
      <Link to="/dashboard">
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Home className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Button>
      </Link>
    </div>
  )
}
