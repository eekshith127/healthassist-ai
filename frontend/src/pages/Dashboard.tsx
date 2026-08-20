import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  Stethoscope,
  CreditCard,
  UserCheck,
  Clock,
  HeartPulse,
  PhoneCall,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar,
  User,
  Ruler,
  Scale,
  Activity,
  AlertCircle,
  Pill,
  FileHeart,
  QrCode,
  CheckCircle2,
  AlertOctagon,
  Phone,
  Video,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { AssessmentCard } from '../components/assessment/AssessmentCard'
import { Modal } from '../components/ui/modal'
import { ResultCard } from '../components/assessment/ResultCard'
import {
  mockAssessmentHistory,
  mockAppointments,
  mockCurrentUser,
} from '../services/mockData'
import { AssessmentRecord, HealthProfile } from '../types'
import {
  fetchHealthProfile,
  calculateProfileCompletion,
  ProfileCompletionReport,
} from '../services/profileService'
import { formatHeight, formatWeight } from '../utils/bmi'
import { useHealthCheck } from '../hooks/useHealthCheck'

export const Dashboard: React.FC = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const { health } = useHealthCheck(15000)

  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  const displayName = user?.fullName || user?.firstName || mockCurrentUser.fullName || 'Patient'

  // Load backend health profile
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        setProfileLoading(true)
        const p = await fetchHealthProfile()
        if (isMounted) {
          setProfile(p)
        }
      } catch (err) {
        console.error('Failed to fetch health profile:', err)
      } finally {
        if (isMounted) {
          setProfileLoading(false)
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Calculate profile completion metrics
  const completionReport: ProfileCompletionReport = calculateProfileCompletion(profile)

  // Derived health card metrics
  const effectiveBloodGroup = profile?.bloodGroup || profile?.blood_group || 'O+'
  const effectiveAge = profile?.age || 31
  const effectiveSex = profile?.sex || 'Male'
  const effectiveHeight = profile?.heightCm || profile?.height_cm || 180
  const effectiveWeight = profile?.weightKg || profile?.weight_kg || 75
  const effectiveBmi = profile?.bmi || 23.1
  const effectiveBmiCategory = profile?.bmiCategory || profile?.bmi_category || 'Normal weight'
  const effectiveConditions = profile?.medicalConditions || profile?.medical_conditions || [
    'Mild Exercise-Induced Bronchospasm',
    'Seasonal Allergic Rhinitis',
  ]
  const effectiveMedications = profile?.medications || [
    'Loratadine 10mg Oral Tablet (Daily)',
    'Albuterol Inhaler (PRN)',
  ]
  const effectiveAllergies = profile?.allergies || [
    'Penicillin / Amoxicillin (Severe)',
    'Peanuts & Tree Nuts (Moderate)',
  ]

  const emergencyContact = {
    name: 'Emily Doe',
    relation: 'Spouse',
    phone: '+1 (555) 234-8910',
  }

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* ========================================================================= */}
      {/* SECTION 1: WELCOME SECTION */}
      {/* ========================================================================= */}
      <section aria-label="Welcome Overview" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {currentDateFormatted}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200/80 dark:border-emerald-900/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {health?.status === 'ok' ? 'FastAPI Connected • Consensus Protocol Active' : 'Multi-LLM Consensus Protocol Active'}
                </span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Your personalized medical telemetry and multi-model clinical triage dashboard is active and synced with verified EHR health records.
            </p>
          </div>

          {/* Quick status & Emergency shortcut */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmergencyModal(true)}
              className="border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 hover:text-rose-800 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
              <span>Emergency 911</span>
            </Button>
            <Link to="/health-card">
              <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                <span>Emergency ID</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 (VISUALLY DOMINANT): PRIMARY AI HEALTH ASSESSMENT CTA */}
      {/* ========================================================================= */}
      <section aria-label="Primary AI Health Assessment" className="relative">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 p-6 sm:p-8 lg:p-10 text-white shadow-2xl border border-emerald-400/30 ring-1 ring-white/10 group">
          {/* Ambient Lighting & Glow FX */}
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none group-hover:bg-emerald-400/35 transition-colors duration-500" />
          <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              {/* Protocol Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold backdrop-blur-md border border-emerald-400/40 shadow-inner">
                <Sparkles className="h-4 w-4 text-emerald-300 animate-spin-slow" />
                <span>Multi-LLM Consensus Triage System</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Start AI Health Assessment
                </h2>
                <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-xl">
                  Describe symptoms in plain language. Our multi-agent clinical consensus engine compares diagnoses across <strong className="text-white font-semibold">Gemini-Med</strong>, <strong className="text-white font-semibold">Med-PaLM</strong>, and <strong className="text-white font-semibold">Clinical GPT</strong> with zero-hallucination safety guardrails.
                </p>
              </div>

              {/* Feature Badges */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-emerald-200/90 font-medium">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  <span>2-Minute Instant Triage</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  <span>98%+ Consensus Target</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <UserCheck className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Clinician Telehealth Ready</span>
                </span>
              </div>
            </div>

            {/* Prominent Action Button Column */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
              <Link to="/assessment" className="w-full">
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-bold bg-white text-emerald-950 hover:bg-emerald-50 hover:scale-[1.02] shadow-xl hover:shadow-2xl transition-all duration-200 gap-3 rounded-2xl group/btn"
                >
                  <Stethoscope className="h-6 w-6 text-emerald-700 group-hover/btn:rotate-12 transition-transform" />
                  <span>Start AI Health Assessment</span>
                  <ArrowRight className="h-5 w-5 text-emerald-700 ml-auto group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <div className="text-center text-[11px] text-emerald-200/75 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                <span>HIPAA-Compliant & Secure Data Isolation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2-COLUMN MAIN CONTENT: (HEALTH CARD SUMMARY + PROFILE COMPLETION) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================================= */}
        {/* SECTION 2: HEALTH CARD SUMMARY (Connected to Backend) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <span>Health Card Summary</span>
              {profileLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />}
            </h2>
            <Link
              to="/health-card"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View My Health Card</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Card className="border-emerald-500/30 dark:border-emerald-900/50 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white shadow-xl overflow-hidden relative">
            {/* Ambient subtle glow inside card */}
            <div className="absolute right-0 top-0 h-40 w-40 bg-emerald-500/10 blur-2xl pointer-events-none" />

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Health Card Header */}
              <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-400">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      ELECTRONIC HEALTH IDENTIFICATION
                    </div>
                    <h3 className="text-lg font-extrabold text-white">{displayName}</h3>
                    <p className="text-xs text-emerald-200/80 font-mono">
                      Patient ID: {mockCurrentUser.patientId}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-300 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                    title="Show Medical QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">Show QR</span>
                  </button>
                </div>
              </div>

              {/* Biometrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-emerald-300/80 uppercase font-semibold flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Age / Sex</span>
                  </div>
                  <div className="text-xs font-bold text-white capitalize">
                    {effectiveAge} yrs • {effectiveSex}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-emerald-300/80 uppercase font-semibold flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    <span>Height</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {formatHeight(effectiveHeight)}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-emerald-300/80 uppercase font-semibold flex items-center gap-1">
                    <Scale className="h-3 w-3" />
                    <span>Weight</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {formatWeight(effectiveWeight)}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-emerald-300/80 uppercase font-semibold flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>Blood / BMI</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400">
                    {effectiveBloodGroup} • {effectiveBmi}{' '}
                    <span className="text-[10px] font-normal text-slate-300">
                      ({effectiveBmiCategory})
                    </span>
                  </div>
                </div>
              </div>

              {/* Conditions, Medications & Allergies Summary */}
              <div className="space-y-3 text-xs">
                {/* Allergies Highlight */}
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1 mb-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Critical Allergies ({effectiveAllergies.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {effectiveAllergies.map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-100 text-[11px] font-medium"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Chronic Conditions & Prescriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="text-[10px] font-semibold text-emerald-300 uppercase flex items-center gap-1">
                      <FileHeart className="h-3 w-3" />
                      <span>Chronic Conditions ({effectiveConditions.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {effectiveConditions.slice(0, 2).map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] truncate max-w-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="text-[10px] font-semibold text-emerald-300 uppercase flex items-center gap-1">
                      <Pill className="h-3 w-3" />
                      <span>Active Medications ({effectiveMedications.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {effectiveMedications.slice(0, 2).map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] truncate max-w-full">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Card Footer: Emergency Contact & View Full Card Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    Emergency Contact: <strong className="text-white">{emergencyContact.name}</strong> ({emergencyContact.relation}) •{' '}
                    <span className="font-mono text-emerald-400">{emergencyContact.phone}</span>
                  </span>
                </div>

                <Link to="/health-card" className="shrink-0">
                  <Button size="sm" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5">
                    <span>Full Health Card</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================================= */}
        {/* SECTION 6: PROFILE COMPLETION STATUS */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Profile Completion</span>
            </h2>
            <Link
              to="/health-profile"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Update Profile
            </Link>
          </div>

          <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Percentage & Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Medical Profile Strength
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                    {completionReport.percentage}%
                  </span>
                </div>

                {/* Animated Gradient Progress Bar */}
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionReport.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {completionReport.completedCount} of {completionReport.totalCount} essential clinical categories fully verified.
                </p>
              </div>

              {/* Checklist Breakdown */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                {completionReport.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          item.completed
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        item.completed
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {item.completed ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Direct CTA */}
              <Link to="/health-profile" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold group">
                  <span>Complete Health Profile</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: QUICK ACTIONS */}
      {/* ========================================================================= */}
      <section aria-label="Quick Actions" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            <span>Quick Actions</span>
          </h2>
          <span className="text-xs text-slate-500">Frequently used shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Start AI Health Assessment */}
          <Link
            to="/assessment"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all group flex flex-col justify-between space-y-3 text-left"
          >
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-110 transition-transform">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                AI Health Assessment
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Launch symptom triage
              </div>
            </div>
          </Link>

          {/* 2. My Health Card */}
          <Link
            to="/health-card"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all group flex flex-col justify-between space-y-3 text-left"
          >
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 w-fit group-hover:scale-110 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                My Health Card
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Digital emergency ID & QR
              </div>
            </div>
          </Link>

          {/* 3. Healthcare Providers */}
          <Link
            to="/providers"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all group flex flex-col justify-between space-y-3 text-left"
          >
            <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 w-fit group-hover:scale-110 transition-transform">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
                Healthcare Providers
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Book telehealth consult
              </div>
            </div>
          </Link>

          {/* 4. Assessment History */}
          <Link
            to="/history"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all group flex flex-col justify-between space-y-3 text-left"
          >
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 w-fit group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Assessment History
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                View past triage reports
              </div>
            </div>
          </Link>

          {/* 5. Health Profile */}
          <Link
            to="/health-profile"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all group flex flex-col justify-between space-y-3 text-left"
          >
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 w-fit group-hover:scale-110 transition-transform">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                Health Profile
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Manage biometrics & vitals
              </div>
            </div>
          </Link>

          {/* 6. Emergency 911 / Crisis */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-md transition-all group flex flex-col justify-between space-y-3 text-left"
          >
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 w-fit group-hover:scale-110 transition-transform">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-rose-700 dark:text-rose-400">
                Emergency 911
              </div>
              <div className="text-[10px] text-rose-500 mt-0.5">
                Speed dial emergency SOS
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: RECENT ASSESSMENTS */}
      {/* ========================================================================= */}
      <section aria-label="Recent Assessments" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <span>Recent Assessments</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-LLM triage evaluations showing chief complaint, severity, consensus score, and resolution status
            </p>
          </div>

          <Link
            to="/history"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View All History</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Assessment cards list using mock assessment data */}
        <div className="space-y-3">
          {mockAssessmentHistory.slice(0, 3).map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onViewDetails={(rec) => setSelectedAssessment(rec)}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* UPCOMING TELEHEALTH APPOINTMENT BANNER (IF ANY) */}
      {/* ========================================================================= */}
      {mockAppointments.length > 0 && (
        <Card className="border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/10">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Confirmed Telehealth Consult
                  </span>
                  <Badge className="bg-emerald-600 text-[10px]">Confirmed</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {mockAppointments[0].providerName} ({mockAppointments[0].specialty}) • {mockAppointments[0].date} at {mockAppointments[0].time}
                </p>
              </div>
            </div>

            <a
              href={mockAppointments[0].meetingLink}
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
            >
              <Button size="sm" className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                <Video className="h-4 w-4" />
                <span>Join Video Room</span>
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSESSMENT DETAIL REPORT */}
      {/* ========================================================================= */}
      {selectedAssessment && (
        <Modal
          isOpen={Boolean(selectedAssessment)}
          onClose={() => setSelectedAssessment(null)}
          title="Clinical Triage Assessment Report"
          description={`ID: ${selectedAssessment.id} • ${selectedAssessment.createdAt || 'Recent'}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" size="sm" onClick={() => setSelectedAssessment(null)}>
                Close
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 text-white font-semibold gap-1.5"
                onClick={() => {
                  setSelectedAssessment(null)
                  navigate('/providers')
                }}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Book Specialist</span>
              </Button>
            </div>
          }
        >
          <ResultCard
            result={selectedAssessment}
            onBookSpecialist={() => {
              setSelectedAssessment(null)
              navigate('/providers')
            }}
          />
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EMERGENCY SPEED DIAL & CRISIS HOTLINES */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title="Emergency Speed Dial & 911 Crisis Access"
        description="Immediate access to emergency responders and critical poison control dispatch lines."
        size="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setShowEmergencyModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3 py-2">
          <a
            href="tel:911"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-colors"
          >
            <div>
              <div className="font-extrabold text-sm text-rose-700 dark:text-rose-400">
                National Emergency Dispatch
              </div>
              <div className="text-xs text-rose-600/80">Immediate police, fire, paramedic EMS</div>
            </div>
            <span className="font-mono text-lg font-black text-rose-600">911</span>
          </a>

          <a
            href="tel:18002221222"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Poison Control Hotline
              </div>
              <div className="text-xs text-slate-500">24/7 toxic ingestion guidance</div>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              1-800-222-1222
            </span>
          </a>

          <a
            href="tel:988"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Suicide & Crisis Lifeline
              </div>
              <div className="text-xs text-slate-500">Free, confidential mental health support</div>
            </div>
            <span className="font-mono text-base font-bold text-emerald-600">988</span>
          </a>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: MEDICAL QR CODE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Emergency Medical QR Code"
        description="First responders can scan this encrypted QR code to inspect your critical allergies, blood group, and emergency contact."
        size="sm"
        footer={
          <Button variant="outline" size="sm" onClick={() => setShowQrModal(false)}>
            Close
          </Button>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
          <div className="p-4 bg-white rounded-3xl shadow-lg border border-slate-200 inline-block">
            <svg viewBox="0 0 160 160" className="h-44 w-44 text-slate-900" fill="currentColor">
              <rect x="10" y="10" width="40" height="40" rx="6" />
              <rect x="20" y="20" width="20" height="20" fill="white" />
              <rect x="25" y="25" width="10" height="10" />

              <rect x="110" y="10" width="40" height="40" rx="6" />
              <rect x="120" y="20" width="20" height="20" fill="white" />
              <rect x="125" y="25" width="10" height="10" />

              <rect x="10" y="110" width="40" height="40" rx="6" />
              <rect x="20" y="120" width="20" height="20" fill="white" />
              <rect x="25" y="125" width="10" height="10" />

              <rect x="60" y="20" width="10" height="20" />
              <rect x="80" y="10" width="20" height="10" />
              <rect x="60" y="60" width="40" height="40" rx="4" fill="#059669" />
              <rect x="70" y="70" width="20" height="20" fill="white" />
              <rect x="75" y="75" width="10" height="10" fill="#059669" />

              <rect x="20" y="60" width="20" height="10" />
              <rect x="30" y="80" width="10" height="20" />
              <rect x="110" y="60" width="20" height="10" />
              <rect x="130" y="80" width="20" height="20" />
              <rect x="70" y="110" width="30" height="10" />
              <rect x="110" y="110" width="20" height="20" />
              <rect x="140" y="120" width="10" height="20" />
              <rect x="60" y="130" width="20" height="20" />
            </svg>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {displayName} • {mockCurrentUser.patientId}
            </div>
            <div className="text-xs text-slate-500">
              Blood: <strong className="text-emerald-600">{effectiveBloodGroup}</strong> • Allergies: <strong className="text-rose-600">{effectiveAllergies.join(', ')}</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Dashboard
