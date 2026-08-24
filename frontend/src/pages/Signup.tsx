import React from 'react'
import { SignUp } from '@clerk/clerk-react'
import { Lock } from 'lucide-react'

export const Signup: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center">
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
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          elements: {
            rootBox: 'w-full max-w-full flex justify-center',
            cardBox: 'w-full max-w-full shadow-none border-0 bg-transparent',
            card: 'w-full max-w-full bg-transparent border-0 shadow-none p-0 m-0',
            main: 'w-full space-y-4',
            headerTitle: 'text-2xl font-semibold text-[#111827] tracking-tight',
            headerSubtitle: 'text-sm text-[#6B7280] mt-1',
            socialButtons: 'w-full space-y-2',
            socialButtonsBlockButton:
              'w-full border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] rounded-lg text-[#111827] text-sm font-medium py-2 transition-colors shadow-none h-10 flex items-center justify-center gap-2',
            socialButtonsBlockButtonText: 'font-medium text-sm text-[#374151]',
            dividerRow: 'w-full my-4 flex items-center',
            dividerLine: 'bg-[#E5E7EB]',
            dividerText: 'text-xs text-[#9CA3AF] px-3 font-normal',
            form: 'w-full space-y-3.5',
            formFieldRow: 'w-full',
            formFieldLabel: 'text-xs font-medium text-[#374151] mb-1.5 block',
            formFieldInput:
              'w-full rounded-lg border border-[#E5E7EB] bg-white text-[#111827] text-sm focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] h-10 px-3.5 transition-colors',
            formButtonPrimary:
              'w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-none border-none h-10 flex items-center justify-center mt-2',
            footer: 'w-full bg-transparent border-0 shadow-none pt-4 pb-0',
            footerAction: 'w-full justify-center flex items-center gap-1',
            footerActionText: 'text-sm text-[#6B7280]',
            footerActionLink: 'text-[#2563EB] font-medium hover:underline text-sm',
            identityPreview: 'w-full rounded-lg border border-[#E5E7EB] p-2.5 bg-[#F9FAFB]',
            identityPreviewText: 'text-sm text-[#111827] font-medium',
            identityPreviewEditButtonIcon: 'text-[#2563EB]',
          },
        }}
      />

      {/* Security & Privacy Assurance Footer */}
      <div className="flex items-center gap-1.5 text-xs text-[#6B7280] pt-6 mt-6 border-t border-[#F3F4F6] w-full justify-center">
        <Lock className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
        <span>Your health records are end-to-end encrypted</span>
      </div>
    </div>
  )
}

export default Signup
