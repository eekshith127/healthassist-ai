import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const isPublishableKeyConfigured =
  Boolean(PUBLISHABLE_KEY) &&
  !PUBLISHABLE_KEY?.startsWith('pk_test_replace') &&
  PUBLISHABLE_KEY !== 'pk_test_your_key_here'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPublishableKeyConfigured ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY!}>
        <App />
      </ClerkProvider>
    ) : (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 bg-slate-800/90 rounded-2xl border border-emerald-500/30 shadow-2xl space-y-4">
          <div className="inline-flex p-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-lg">
            HealthAssist Clerk Setup Required
          </div>
          <h2 className="text-xl font-bold">Clerk Publishable Key Missing</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Please add your <code>VITE_CLERK_PUBLISHABLE_KEY</code> from the{' '}
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 underline font-semibold"
            >
              Clerk Dashboard
            </a>{' '}
            into <code>frontend/.env</code>.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg text-left text-xs font-mono text-emerald-300">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </div>
        </div>
      </div>
    )}
  </StrictMode>
)
