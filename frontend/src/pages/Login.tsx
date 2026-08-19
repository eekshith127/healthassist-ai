import React from 'react'
import { SignIn } from '@clerk/clerk-react'

export const Login: React.FC = () => {
  return (
    <div className="w-full flex justify-center items-center">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md mx-auto shadow-xl rounded-2xl overflow-hidden',
            card: 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-none rounded-2xl p-6 sm:p-8',
            headerTitle: 'text-2xl font-bold text-slate-900 dark:text-white',
            headerSubtitle: 'text-sm text-slate-500 dark:text-slate-400',
            formButtonPrimary:
              'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm',
            formFieldInput:
              'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500',
            footerActionLink: 'text-emerald-600 dark:text-emerald-400 font-semibold hover:underline',
          },
        }}
      />
    </div>
  )
}

export default Login
