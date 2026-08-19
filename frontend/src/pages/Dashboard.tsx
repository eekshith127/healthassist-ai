import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope,
  CreditCard,
  Heart,
  Activity,
  Droplets,
  Moon,
  Zap,
  Thermometer,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  Video,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { AssessmentCard } from '../components/assessment/AssessmentCard'
import { HealthCard } from '../components/health/HealthCard'
import { Modal } from '../components/ui/modal'
import { ResultCard } from '../components/assessment/ResultCard'
import {
  mockCurrentUser,
  mockVitals,
  mockAssessmentHistory,
  mockAppointments,
} from '../services/mockData'
import { AssessmentRecord, HealthProfile } from '../types'
import { fetchHealthProfile } from '../services/profileService'

export const Dashboard: React.FC = () => {
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null)
  const [profile, setProfile] = useState<HealthProfile | null>(null)

  useEffect(() => {
    fetchHealthProfile().then(setProfile).catch(() => {})
  }, [])

  const getVitalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart':
        return <Heart className="h-5 w-5 text-rose-500" />
      case 'Activity':
        return <Activity className="h-5 w-5 text-emerald-500" />
      case 'Droplets':
        return <Droplets className="h-5 w-5 text-cyan-500" />
      case 'Moon':
        return <Moon className="h-5 w-5 text-indigo-500" />
      case 'Zap':
        return <Zap className="h-5 w-5 text-amber-500" />
      case 'Thermometer':
        return <Thermometer className="h-5 w-5 text-orange-500" />
      default:
        return <Activity className="h-5 w-5 text-emerald-500" />
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-emerald-400/30">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>Multi-LLM Clinical Consensus Protocol Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, {mockCurrentUser.fullName} 👋
            </h1>
            <p className="text-emerald-100/90 text-sm leading-relaxed">
              Your biometric health vitals are stable. How are you feeling today? You can launch an instant AI triage assessment or connect with a board-certified physician.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/assessment">
              <Button size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50 shadow-md font-semibold gap-2">
                <Stethoscope className="h-5 w-5 text-emerald-700" />
                <span>Start AI Triage</span>
              </Button>
            </Link>
            <Link to="/health-card">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm gap-2">
                <CreditCard className="h-5 w-5" />
                <span>Emergency ID</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />
      </div>

      {/* Vital Metrics Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <span>Real-time Biometrics & Vitals</span>
          </h2>
          <Link
            to="/health-profile"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Update Vitals</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {mockVitals.map((vital) => (
            <div
              key={vital.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  {getVitalIcon(vital.iconName)}
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {vital.status}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-500 truncate">
                  {vital.title}
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {vital.value}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{vital.unit}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-100 dark:border-slate-800/80">
                {vital.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Recent Triage Records & Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Video Consultation */}
          {mockAppointments.length > 0 && (
            <Card className="border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Upcoming Telehealth Consultation</CardTitle>
                      <CardDescription>Verified clinician handoff with attached triage log</CardDescription>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
                    Confirmed
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {mockAppointments[0].providerName}
                    </h4>
                    <p className="text-xs text-emerald-600 font-semibold">
                      {mockAppointments[0].specialty} • {mockAppointments[0].hospital}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-2 pt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{mockAppointments[0].date} at {mockAppointments[0].time}</span>
                    </p>
                  </div>

                  <a
                    href={mockAppointments[0].meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      <Video className="h-4 w-4" />
                      <span>Join HD Video Room</span>
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent AI Triage History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                <span>Recent AI Symptom Triage Reports</span>
              </h2>
              <Link
                to="/history"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View All Records</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {mockAssessmentHistory.map((rec) => (
                <AssessmentCard
                  key={rec.id}
                  assessment={rec}
                  onViewDetails={(rec) => setSelectedAssessment(rec)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Digital Emergency Card & Safety Guarantee */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Digital Emergency ID Card
              </h3>
              <Link
                to="/health-card"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View Wallet PDF
              </Link>
            </div>
            <HealthCard profile={profile} showActions={false} />
          </div>

          {/* Safety & Protocol Box */}
          <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                <span>HIPAA & Clinical Safety Guarantee</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Every symptom triage analysis runs through our proprietary multi-model safety layer to eliminate medical hallucinations and flag life-threatening red flags immediately.
              </p>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
                🔒 Encrypted end-to-end telemetry. Your health data is never shared with third-party advertising networks.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assessment Details Modal */}
      {selectedAssessment && (
        <Modal
          isOpen={!!selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          title="Clinical Triage Details"
          size="xl"
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedAssessment(null)}>
              Close
            </Button>
          }
        >
          <ResultCard
            result={selectedAssessment}
            onBookSpecialist={() => setSelectedAssessment(null)}
          />
        </Modal>
      )}
    </div>
  )
}
