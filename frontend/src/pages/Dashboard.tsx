import React, { useState, useEffect } from 'react'
import {
  Stethoscope,
  Clock,
  CreditCard,
  User,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { SeverityBadge } from '../components/common/SeverityBadge'
import { HealthProfile, AssessmentRecord } from '../types'
import { profileApi, assessmentApi } from '../services/api'
import { calculateProfileCompletion, normalizeProfile } from '../services/profileService'
import { cn } from '../utils/cn'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { getToken } = useAuth()

  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Calmer first name display
  const firstName = user?.firstName || (user?.fullName ? user.fullName.split(' ')[0] : 'Patient')

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const token = await getToken()
        if (token) {
          const profileData = await profileApi.getProfile(token)
          if (isMounted && profileData) {
            setProfile(normalizeProfile(profileData))
          }

          const historyData = await assessmentApi.getAssessments(token)
          if (isMounted && historyData) {
            setAssessments(historyData)
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      isMounted = false
    }
  }, [getToken])

  // Profile completion report computed from real database data
  const completionReport = calculateProfileCompletion(profile)
  const isProfileComplete = completionReport.percentage === 100
  const recentAssessments = assessments.slice(0, 5)

  // Real BMI calculation if height and weight exist
  const height = profile?.heightCm || profile?.height_cm
  const weight = profile?.weightKg || profile?.weight_kg
  let bmiValue: string | null = null
  let bmiCategory: string = 'Not recorded'

  if (profile?.bmi) {
    bmiValue = String(profile.bmi)
    bmiCategory = profile.bmiCategory || 'Normal range'
  } else if (height && weight && height > 0 && weight > 0) {
    const hM = height / 100
    const calcBmi = (weight / (hM * hM)).toFixed(1)
    bmiValue = calcBmi
    const num = parseFloat(calcBmi)
    if (num < 18.5) bmiCategory = 'Underweight'
    else if (num < 25) bmiCategory = 'Normal range'
    else if (num < 30) bmiCategory = 'Overweight'
    else bmiCategory = 'Obese'
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* 1. DASHBOARD HEADER */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight leading-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-[#6B7280] leading-normal">
            Here's an overview of your health profile and recent clinical assessments.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => navigate('/assessment')}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium h-9 px-4 gap-2 rounded-lg"
          >
            <Stethoscope className="h-4 w-4" />
            <span>Start assessment</span>
          </Button>
        </div>
      </div>

      {/* 2. PROFILE COMPLETION BANNER (IF INCOMPLETE) */}
      {!loading && !isProfileComplete && (
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#D97706] shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-[#111827]">
                Health profile is {completionReport.percentage}% complete.
              </span>{' '}
              <span className="text-[#6B7280]">
                Add baseline biometrics and allergies for improved triage accuracy.
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-xs shrink-0 self-start sm:self-auto h-8 px-3 border-[#E5E7EB]"
          >
            Complete profile
          </Button>
        </div>
      )}

      {/* 3. KEY STAT CARDS (QUIET DATA CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessments */}
        <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle p-5">
          <div className="space-y-2">
            <div className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">
              Total Assessments
            </div>
            <div className="text-[26px] font-semibold text-[#111827] leading-none">
              {loading ? <RefreshCw className="h-5 w-5 animate-spin text-[#9CA3AF]" /> : assessments.length}
            </div>
            <div className="text-[13px] text-[#6B7280]">
              {assessments.length === 1 ? '1 recorded session' : `${assessments.length} recorded sessions`}
            </div>
          </div>
        </Card>

        {/* Profile Completion */}
        <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle p-5">
          <div className="space-y-2">
            <div className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">
              Profile Completion
            </div>
            <div className="text-[26px] font-semibold text-[#111827] leading-none flex items-center justify-between">
              <span>{loading ? <RefreshCw className="h-5 w-5 animate-spin text-[#9CA3AF]" /> : `${completionReport.percentage}%`}</span>
            </div>
            <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                style={{ width: `${completionReport.percentage}%` }}
              />
            </div>
            <div className="text-[13px] text-[#6B7280]">
              {isProfileComplete ? 'Full clinical baseline' : 'Incomplete records'}
            </div>
          </div>
        </Card>

        {/* BMI Index */}
        <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle p-5">
          <div className="space-y-2">
            <div className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">
              BMI Index
            </div>
            <div className="text-[26px] font-semibold text-[#111827] leading-none">
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin text-[#9CA3AF]" />
              ) : bmiValue ? (
                bmiValue
              ) : (
                <span className="text-sm font-normal text-[#6B7280]">Not available</span>
              )}
            </div>
            <div className="text-[13px] text-[#6B7280]">
              {bmiValue ? bmiCategory : 'Complete your health profile'}
            </div>
          </div>
        </Card>

        {/* Consensus Engine */}
        <Card className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle p-5">
          <div className="space-y-2">
            <div className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">
              Consensus Engine
            </div>
            <div className="text-[26px] font-semibold text-[#2563EB] leading-none">
              3 models
            </div>
            <div className="text-[13px] text-[#6B7280] truncate">
              Llama 3.1 • Gemini • Nemotron
            </div>
          </div>
        </Card>
      </div>

      {/* 4. MAIN CONTENT SPLIT: Recent Assessments Table & Health Card Baseline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Assessments Data Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#111827]">
              Recent assessments
            </h2>
            {assessments.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
              >
                <span>View all history</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-subtle">
            {loading ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin text-[#9CA3AF] mx-auto" />
                <p className="text-xs text-[#6B7280]">Loading assessments...</p>
              </div>
            ) : recentAssessments.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="space-y-1">
                  <h4 className="text-[15px] font-semibold text-[#111827]">No assessments yet.</h4>
                  <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                    Start an AI health assessment to evaluate your symptoms with our tri-model consensus protocol.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/assessment')}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium gap-1.5 h-8 px-3"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Start assessment</span>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                <div className="grid grid-cols-12 px-4 py-2.5 bg-[#F9FAFB] text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB]">
                  <span className="col-span-3">Date</span>
                  <span className="col-span-4">Summary</span>
                  <span className="col-span-3">Severity</span>
                  <span className="col-span-2 text-right">Consensus</span>
                </div>
                {recentAssessments.map((ass) => {
                  const triage = ass.triageLevel || ass.triage_level || 'non-urgent'
                  const dateStr = ass.createdAt || ass.created_at || 'Recent'
                  const score = ass.consensusScore || ass.consensus_score
                  return (
                    <div
                      key={ass.id}
                      onClick={() => navigate(`/assessment?id=${ass.id}`)}
                      className="grid grid-cols-12 items-center px-4 py-3 text-[13px] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                    >
                      <span className="col-span-3 text-[#6B7280] truncate text-xs">
                        {dateStr.split('T')[0] || dateStr}
                      </span>
                      <span className="col-span-4 font-medium text-[#111827] truncate pr-2">
                        {ass.symptoms}
                      </span>
                      <span className="col-span-3">
                        <SeverityBadge severity={triage as any} size="sm" />
                      </span>
                      <span className="col-span-2 text-right font-medium text-[#111827] text-xs">
                        {score ? `${Number(score).toFixed(0)}/100` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Quick Actions & Health Card Summary */}
        <div className="space-y-6">
          {/* Quick Actions (Clean List) */}
          <div className="space-y-3">
            <h2 className="text-[16px] font-semibold text-[#111827]">
              Quick actions
            </h2>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/assessment')}
                className="w-full p-3.5 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] rounded-xl text-left transition-colors flex items-center justify-between group shadow-subtle"
              >
                <div>
                  <div className="text-[13px] font-semibold text-[#111827]">
                    AI Health Assessment
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Start a new symptom evaluation
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/health-card')}
                className="w-full p-3.5 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] rounded-xl text-left transition-colors flex items-center justify-between group shadow-subtle"
              >
                <div>
                  <div className="text-[13px] font-semibold text-[#111827]">
                    My Health Card
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    View your digital medical record
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="w-full p-3.5 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] rounded-xl text-left transition-colors flex items-center justify-between group shadow-subtle"
              >
                <div>
                  <div className="text-[13px] font-semibold text-[#111827]">
                    Health Profile
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    View and update clinical details
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Medical Baseline Summary Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <span className="text-[13px] font-semibold text-[#111827]">
                Clinical baseline
              </span>
              <button
                type="button"
                onClick={() => navigate('/health-card')}
                className="text-[11px] font-medium text-[#2563EB] hover:underline"
              >
                Full record
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6B7280] text-[11px] block">Blood Group</span>
                <span className="font-medium text-[#111827]">
                  {profile?.bloodGroup || profile?.blood_group || profile?.bloodType || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] text-[11px] block">Age / Gender</span>
                <span className="font-medium text-[#111827]">
                  {profile?.age ? `${profile.age} yrs` : '—'} / {profile?.sex || profile?.gender || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] text-[11px] block">Height</span>
                <span className="font-medium text-[#111827]">
                  {profile?.heightCm || profile?.height_cm ? `${profile.heightCm || profile.height_cm} cm` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] text-[11px] block">Weight</span>
                <span className="font-medium text-[#111827]">
                  {profile?.weightKg || profile?.weight_kg ? `${profile.weightKg || profile.weight_kg} kg` : '—'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#6B7280]">Profile status</span>
              <span
                className={cn(
                  'font-medium text-[11px]',
                  isProfileComplete ? 'text-[#16A34A]' : 'text-[#D97706]'
                )}
              >
                {isProfileComplete ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
