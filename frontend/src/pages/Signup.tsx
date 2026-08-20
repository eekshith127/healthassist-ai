import React from 'react'
import { SignUp } from '@clerk/clerk-react'

export const Signup: React.FC = () => {
  return (
    <div className="w-full flex justify-center items-center">
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        fallbackRedirectUrl="/health-profile"
        appearance={{
          variables: {
            colorPrimary: '#065f46', // Deep muted medical forest green
            colorText: '#0f172a',
            colorTextSecondary: '#64748b',
            borderRadius: '8px',
            fontFamily: 'inherit',
          },
          elements: {
            rootBox: 'w-full max-w-[400px] mx-auto',
            card: 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] rounded-xl p-6 sm:p-8',
            headerTitle: 'text-2xl font-bold text-slate-900 dark:text-white tracking-tight',
            headerSubtitle: 'text-sm text-slate-500 dark:text-slate-400 mt-1',
            formButtonPrimary:
              'bg-[#065f46] hover:bg-[#044e3a] text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-none border-none',
            socialButtonsBlockButton:
              'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium py-2 transition-colors shadow-none',
            formFieldInput:
              'rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-[#065f46] focus:ring-1 focus:ring-[#065f46] h-10',
            formFieldLabel: 'text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1',
            footerActionLink: 'text-[#065f46] dark:text-emerald-400 font-semibold hover:underline',
            dividerLine: 'bg-slate-200 dark:bg-slate-800',
            dividerText: 'text-xs text-slate-400',
          },
        }}
      />
    </div>
  )
}

export default Signup
