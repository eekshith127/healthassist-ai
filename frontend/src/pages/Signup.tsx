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
            colorPrimary: '#2563EB',
            colorText: '#111827',
            colorTextSecondary: '#6B7280',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
          },
          elements: {
            rootBox: 'w-full max-w-[400px] mx-auto',
            card: 'bg-white border border-[#E5E7EB] shadow-subtle rounded-xl p-6 sm:p-8',
            headerTitle: 'text-2xl font-semibold text-[#111827] tracking-tight',
            headerSubtitle: 'text-sm text-[#6B7280] mt-1',
            formButtonPrimary:
              'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-none border-none',
            socialButtonsBlockButton:
              'border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] rounded-lg text-[#111827] text-sm font-medium py-2 transition-colors shadow-none',
            formFieldInput:
              'rounded-lg border border-[#E5E7EB] bg-white text-[#111827] text-sm focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] h-10',
            formFieldLabel: 'text-xs font-medium text-[#374151] mb-1',
            footerActionLink: 'text-[#2563EB] font-medium hover:underline',
            dividerLine: 'bg-[#E5E7EB]',
            dividerText: 'text-xs text-[#9CA3AF]',
          },
        }}
      />
    </div>
  )
}

export default Signup
