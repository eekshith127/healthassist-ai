import React, { useState } from 'react'
import {
  Star,
  Video,
  Calendar,
  MapPin,
  Clock,
  Globe,
  Check,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Avatar } from '../ui/avatar'
import { Modal } from '../ui/modal'
import { HealthcareProvider } from '../../types'
import { cn } from '../../utils/cn'

export interface ProviderCardProps {
  provider: HealthcareProvider
  onBookSuccess?: (provider: HealthcareProvider, slot: string) => void
  className?: string
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onBookSuccess,
  className,
}) => {
  const slots = provider.nextSlots && provider.nextSlots.length > 0 ? provider.nextSlots : ['Today 2:00 PM', 'Tomorrow 10:00 AM']
  const languages = provider.languages && provider.languages.length > 0 ? provider.languages : ['English']
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(slots[0])
  const [isBooked, setIsBooked] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  const handleConfirmBooking = () => {
    setBookingLoading(true)
    setTimeout(() => {
      setBookingLoading(false)
      setIsBooked(true)
      onBookSuccess?.(provider, selectedSlot)
      setTimeout(() => {
        setIsModalOpen(false)
        setIsBooked(false)
      }, 1800)
    }, 1000)
  }

  return (
    <>
      <Card
        className={cn(
          'group hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between',
          className
        )}
      >
        <CardContent className="p-5 space-y-4">
          {/* Header: Avatar, Name, Badge */}
          <div className="flex items-start gap-3.5">
            <Avatar
              initials={provider.initials || provider.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              size="lg"
              status="verified"
              className="mt-0.5 shadow-md"
            />

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight truncate">
                  {provider.name}
                </h4>
                {provider.acceptingNewPatients && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                    Accepting Patients
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {provider.specialty}
              </p>

              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                <span>{provider.hospital}</span>
              </p>
            </div>
          </div>

          {/* Details Pill Row */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {provider.rating.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400">({provider.reviewsCount})</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-teal-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate">
                {languages.join(', ')}
              </span>
            </div>
          </div>

          {/* Availability Box */}
          <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-medium text-[11px]">{provider.availability}</span>
            </div>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
              {provider.telehealthFee || '$45 / Visit'}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="pt-2 flex gap-2">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-semibold"
            >
              <Video className="h-4 w-4" />
              <span>Book Video Consult</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <Avatar initials={provider.initials || 'MD'} size="sm" />
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Book Telehealth Consultation
              </div>
              <div className="text-xs text-emerald-600 font-normal">
                {provider.name} • {provider.specialty}
              </div>
            </div>
          </div>
        }
        description="Select an available time slot for your secure HD video consultation with multi-LLM triage history attached."
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleConfirmBooking}
              isLoading={bookingLoading}
              className="gap-1.5 bg-emerald-600 text-white"
            >
              {isBooked ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Consultation Confirmed!</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>Confirm Appointment ({selectedSlot})</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Available Time Slots
            </label>
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    'p-3 rounded-xl border text-xs font-semibold text-left transition-all',
                    selectedSlot === slot
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
