import React, { useState } from 'react'
import {
  UserCheck,
  Search,
  CheckCircle2,
} from 'lucide-react'
import { ProviderCard } from '../components/providers/ProviderCard'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { mockProviders } from '../services/mockData'
import { HealthcareProvider } from '../types'

export const Providers: React.FC = () => {
  const [search, setSearch] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')
  const [onlyAccepting, setOnlyAccepting] = useState(false)
  const [successToast, setSuccessToast] = useState<{
    provider: HealthcareProvider
    slot: string
  } | null>(null)

  const specialties = [
    'All',
    'Family Medicine',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Pulmonology',
    'Orthopedics',
  ]

  const filteredProviders = mockProviders.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty.toLowerCase().includes(search.toLowerCase()) ||
      p.hospital.toLowerCase().includes(search.toLowerCase())
    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      p.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
    const matchesAccepting = onlyAccepting ? p.acceptingNewPatients : true
    return matchesSearch && matchesSpecialty && matchesAccepting
  })

  const handleBookingSuccess = (provider: HealthcareProvider, slot: string) => {
    setSuccessToast({ provider, slot })
    setTimeout(() => setSuccessToast(null), 5000)
  }

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-300">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-700 text-white shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-top-4 duration-300">
          <div className="p-2 rounded-xl bg-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-sm">Consultation Scheduled!</div>
            <div>
              {successToast.provider.name} • {successToast.slot}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-emerald-600" />
          <span>Connected Telehealth Clinicians</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse verified board-certified clinicians available for live HD video consultations and seamless AI triage review.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search provider by name, specialty, or clinic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <button
            onClick={() => setOnlyAccepting(!onlyAccepting)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-2 shrink-0 ${
              onlyAccepting
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                onlyAccepting ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <span>Accepting New Patients Only</span>
          </button>
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Providers Grid */}
      {filteredProviders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <UserCheck className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No Clinicians Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or specialty filters to find available doctors.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setSelectedSpecialty('All')
              setOnlyAccepting(false)
            }}
          >
            Reset All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onBookSuccess={handleBookingSuccess}
            />
          ))}
        </div>
      )}
    </div>
  )
}
