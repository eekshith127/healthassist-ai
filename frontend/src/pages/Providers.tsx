import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { UserCheck, Search, Star, Video, Calendar, ShieldCheck, MapPin } from 'lucide-react'

export const Providers: React.FC = () => {
  const [search, setSearch] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')

  const providers = [
    {
      id: 1,
      name: 'Dr. Sarah Jenkins, MD',
      specialty: 'Family Medicine & Tele-Triage',
      hospital: 'Metro Health Telemedicine Network',
      rating: 4.9,
      reviewsCount: 142,
      availability: 'Available Today (Next: 2:00 PM)',
      initials: 'SJ',
      accepting: true,
    },
    {
      id: 2,
      name: 'Dr. Marcus Chen, MD, FACC',
      specialty: 'Cardiology Specialist',
      hospital: 'Cardiovascular Care Associates',
      rating: 4.95,
      reviewsCount: 98,
      availability: 'Tomorrow 10:00 AM',
      initials: 'MC',
      accepting: true,
    },
    {
      id: 3,
      name: 'Dr. Elena Rostova, MD',
      specialty: 'Dermatology & Skin Telehealth',
      hospital: 'Advanced Skin & Allergy Institute',
      rating: 4.8,
      reviewsCount: 76,
      availability: 'Available Today (Next: 4:30 PM)',
      initials: 'ER',
      accepting: true,
    },
    {
      id: 4,
      name: 'Dr. David Kim, DO',
      specialty: 'Neurology & Headache Clinic',
      hospital: 'Neurological Sciences Telehealth Group',
      rating: 4.85,
      reviewsCount: 110,
      availability: 'Friday 11:15 AM',
      initials: 'DK',
      accepting: false,
    },
  ]

  const specialties = ['All', 'Family Medicine', 'Cardiology', 'Dermatology', 'Neurology']

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty.toLowerCase().includes(search.toLowerCase()) ||
      p.hospital.toLowerCase().includes(search.toLowerCase())
    const matchesSpecialty =
      selectedSpecialty === 'All' || p.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
    return matchesSearch && matchesSpecialty
  })

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-emerald-600" />
          <span>Connected Telehealth Providers</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse verified board-certified clinicians ready for instant video consultations and AI triage follow-ups.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search provider by name, specialty, or clinic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Provider List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProviders.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {doctor.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                      {doctor.name}
                    </h3>
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {doctor.specialty}
                    </div>
                  </div>
                </div>

                <Badge variant={doctor.accepting ? 'default' : 'secondary'} className="text-[10px]">
                  {doctor.accepting ? 'Accepting Patients' : 'Waitlist'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 border-y py-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{doctor.hospital}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{doctor.rating}</span>
                    <span className="text-slate-400 font-normal">({doctor.reviewsCount} reviews)</span>
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {doctor.availability}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs">
                  <Video className="h-3.5 w-3.5" />
                  <span>Book Tele-Consult</span>
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>View Schedule</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
