import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  FileHeart,
  AlertTriangle,
  Pill,
  Save,
  Check,
  Plus,
  Trash2,
  Activity,
  ShieldCheck,
  Lock,
  Sparkles,
  Scissors,
  Users,
  Eye,
  RefreshCw,
  ArrowRight,
  Heart,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { HealthCard } from '../components/health/HealthCard'
import { HealthProfile as HealthProfileType } from '../types'
import { profileApi } from '../services/api'
import { normalizeProfile } from '../services/profileService'
import { calculateBMI, calculateAge, formatHeight, formatWeight } from '../utils/bmi'

export const HealthProfile: React.FC = () => {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<HealthProfileType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  // Form Field States
  const [dob, setDob] = useState('')
  const [sex, setSex] = useState('male')
  const [heightCm, setHeightCm] = useState<number | ''>('')
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  // List States
  const [medicalConditions, setMedicalConditions] = useState<string[]>([])
  const [medications, setMedications] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [previousSurgeries, setPreviousSurgeries] = useState<string[]>([])
  const [familyHistory, setFamilyHistory] = useState<string[]>([])

  // Temp Inputs
  const [newCondition, setNewCondition] = useState('')
  const [newMedication, setNewMedication] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [newSurgery, setNewSurgery] = useState('')
  const [newFamilyHistory, setNewFamilyHistory] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load Profile directly from Supabase DB via Clerk Bearer Token
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setIsLoading(true)
      try {
        const token = await getToken()
        if (token) {
          const raw = await profileApi.getProfile(token)
          if (isMounted && raw) {
            const data = normalizeProfile(raw)
            setProfile(data)
            if (data?.dateOfBirth) setDob(data.dateOfBirth.split('T')[0])
            if (data?.sex) setSex(data.sex.toLowerCase())
            if (data?.heightCm) setHeightCm(data.heightCm)
            if (data?.weightKg) setWeightKg(data.weightKg)
            if (data?.bloodGroup) setBloodGroup(data.bloodGroup)
            if (data?.medicalConditions) setMedicalConditions(data.medicalConditions)
            if (data?.medications) setMedications(data.medications)
            if (data?.allergies) setAllergies(data.allergies)
            if (data?.previousSurgeries) setPreviousSurgeries(data.previousSurgeries)
            if (data?.familyHistory) setFamilyHistory(data.familyHistory)
            if (data?.emergencyContact) setEmergencyContact(data.emergencyContact)
            if (data?.emergencyPhone) setEmergencyPhone(data.emergencyPhone)
          }
        }
      } catch (err) {
        console.error('Failed to load health profile:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [getToken])

  const numHeight = typeof heightCm === 'number' ? heightCm : 0
  const numWeight = typeof weightKg === 'number' ? weightKg : 0
  const bmiResult = numHeight > 0 && numWeight > 0 ? calculateBMI(numHeight, numWeight) : null
  const ageResult = dob ? calculateAge(dob) : null

  const currentProfilePreview: HealthProfileType = {
    ...profile,
    dateOfBirth: dob || null,
    sex,
    heightCm: numHeight || null,
    weightKg: numWeight || null,
    bloodGroup: bloodGroup || null,
    medicalConditions,
    medications,
    allergies,
    previousSurgeries,
    familyHistory,
    emergencyContact: emergencyContact || null,
    emergencyPhone: emergencyPhone || null,
    bmi: bmiResult?.bmi ?? null,
    bmiCategory: bmiResult?.category ?? null,
    age: ageResult ?? null,
    profileCompleted: Boolean(dob && sex && bloodGroup),
  }

  const handleAddCondition = () => {
    if (!newCondition.trim()) return
    setMedicalConditions([...medicalConditions, newCondition.trim()])
    setNewCondition('')
  }

  const handleAddMedication = () => {
    if (!newMedication.trim()) return
    setMedications([...medications, newMedication.trim()])
    setNewMedication('')
  }

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return
    setAllergies([...allergies, newAllergy.trim()])
    setNewAllergy('')
  }

  const handleAddSurgery = () => {
    if (!newSurgery.trim()) return
    setPreviousSurgeries([...previousSurgeries, newSurgery.trim()])
    setNewSurgery('')
  }

  const handleAddFamilyHistory = () => {
    if (!newFamilyHistory.trim()) return
    setFamilyHistory([...familyHistory, newFamilyHistory.trim()])
    setNewFamilyHistory('')
  }

  const handleSave = async (e: React.FormEvent, shouldRedirect = false) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (numHeight > 0 && (numHeight < 40 || numHeight > 260)) {
      newErrors.height = 'Height must be between 40 and 260 cm'
    }
    if (numWeight > 0 && (numWeight < 20 || numWeight > 400)) {
      newErrors.weight = 'Weight must be between 20 and 400 kg'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSaveError(null)
    setIsSaving(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication session expired. Please refresh the page.')
      }

      const payload = {
        date_of_birth: dob || null,
        sex: sex || null,
        height_cm: numHeight > 0 ? numHeight : null,
        weight_kg: numWeight > 0 ? numWeight : null,
        blood_group: bloodGroup || null,
        medical_conditions: medicalConditions,
        medications,
        allergies,
        previous_surgeries: previousSurgeries,
        family_history: familyHistory,
        emergency_contact: emergencyContact || null,
        emergency_phone: emergencyPhone || null,
      }

      const updatedRaw = await profileApi.updateProfile(payload, token)
      setProfile(normalizeProfile(updatedRaw))

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)

      if (shouldRedirect) {
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('Save failed:', err)
      setSaveError(err.message || 'Failed to save health profile. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="h-6 w-6 text-[#2563EB] animate-spin" />
        <div className="text-xs text-[#6B7280]">
          Loading clinical health profile...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#111827] leading-tight">
            Health Profile
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Baseline biometrics, active prescriptions, and clinical history for automated triage.
          </p>
        </div>

        {/* View Switcher Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Eye className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Card preview</span>
            </button>
          </div>

          <Button
            onClick={(e) => handleSave(e, true)}
            disabled={isSaving}
            className="gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-3"
          >
            <span>{isSaving ? 'Saving...' : 'Save & Exit'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex items-start gap-3 shadow-subtle">
        <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] shrink-0 mt-0.5 border border-[#DBEAFE]">
          <Lock className="h-3.5 w-3.5" />
        </div>
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-[#111827] flex items-center gap-2">
            <span>HIPAA-compliant context minimization</span>
          </div>
          <p className="text-[#6B7280] leading-relaxed">
            Your profile serves as persistent baseline context during assessments. Raw identifiers are never transmitted to LLM engines; only clinical contraindications and relevant symptoms are passed.
          </p>
        </div>
      </div>

      {/* Save Error Notification */}
      {saveError && (
        <div className="p-3.5 rounded-xl bg-red-50 text-[#DC2626] border border-red-200 flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE] flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#16A34A]" />
            <span>Health profile updated and synchronized with your records.</span>
          </div>
          <span className="text-[11px] text-[#6B7280]">Saved to database</span>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'preview' ? (
        <div className="space-y-4">
          <div className="text-center space-y-0.5">
            <h3 className="font-semibold text-sm text-[#111827]">Digital Health Card Preview</h3>
            <p className="text-xs text-[#6B7280]">Live preview with updated biometrics.</p>
          </div>
          <HealthCard profile={currentProfilePreview} showActions={true} />
        </div>
      ) : (
        <form onSubmit={(e) => handleSave(e, false)} className="space-y-6">
          {/* Section 1: Core Biometrics & Real-Time BMI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Core Form Fields */}
            <Card className="lg:col-span-2 border border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5 space-y-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#2563EB]" />
                  <span>Core Biometrics & Demographics</span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Physical metrics used for clinical dosing and baseline reference.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#374151]">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      error={errors.dob}
                      className="text-xs h-9 bg-white border-[#E5E7EB]"
                    />
                    {ageResult !== null && (
                      <span className="text-[11px] text-[#6B7280]">
                        Current Age: <strong className="text-[#111827]">{ageResult} yrs</strong>
                      </span>
                    )}
                  </div>

                  {/* Biological Sex */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#374151]">
                      Biological Sex
                    </label>
                    <Select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      options={[
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Other / Non-Binary', value: 'other' },
                      ]}
                      className="text-xs h-9 bg-white border-[#E5E7EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Height */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#374151]">
                      Height (cm)
                    </label>
                    <Input
                      type="number"
                      value={heightCm === '' ? '' : heightCm}
                      onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 175"
                      error={errors.height}
                      className="text-xs h-9 bg-white border-[#E5E7EB]"
                    />
                    {numHeight > 0 && (
                      <span className="text-[11px] text-[#6B7280]">
                        {formatHeight(numHeight)}
                      </span>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#374151]">
                      Weight (kg)
                    </label>
                    <Input
                      type="number"
                      value={weightKg === '' ? '' : weightKg}
                      onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 70"
                      error={errors.weight}
                      className="text-xs h-9 bg-white border-[#E5E7EB]"
                    />
                    {numWeight > 0 && (
                      <span className="text-[11px] text-[#6B7280]">
                        {formatWeight(numWeight)}
                      </span>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#374151]">
                      Blood Group
                    </label>
                    <Select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      options={[
                        { label: 'Select blood group...', value: '' },
                        { label: 'O+ (O Positive)', value: 'O+' },
                        { label: 'O- (O Negative)', value: 'O-' },
                        { label: 'A+ (A Positive)', value: 'A+' },
                        { label: 'A- (A Negative)', value: 'A-' },
                        { label: 'B+ (B Positive)', value: 'B+' },
                        { label: 'B- (B Negative)', value: 'B-' },
                        { label: 'AB+ (AB Positive)', value: 'AB+' },
                        { label: 'AB- (AB Negative)', value: 'AB-' },
                      ]}
                      error={Boolean(errors.bloodGroup)}
                      className="text-xs h-9 bg-white border-[#E5E7EB]"
                    />
                  </div>
                </div>

                {/* Emergency Contact fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-[#E5E7EB]">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#374151] flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-[#DC2626]" />
                      <span>Emergency Contact Name</span>
                    </label>
                    <Input
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Spouse / Next of Kin"
                      className="text-xs h-9 bg-white border-[#E5E7EB]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#374151]">
                      Emergency Phone
                    </label>
                    <Input
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="text-xs h-9 bg-white border-[#E5E7EB]"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Real-time Dynamic BMI Gauge Card */}
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#111827]">
                    BMI Calculator
                  </div>
                  <span className="text-[10px] font-medium text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                    Calculated
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Derived from height ({numHeight || '—'} cm) and weight ({numWeight || '—'} kg).
                </p>
              </div>

              <div className="text-center p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                <div className="text-3xl font-semibold tracking-tight text-[#111827]">
                  {bmiResult?.bmi ?? '—'}
                </div>
                <div className="text-xs font-medium text-[#2563EB]">
                  {bmiResult?.category || 'Provide height & weight'}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-[#6B7280]">
                <div className="flex justify-between">
                  <span>Standard:</span>
                  <span className="font-medium text-[#111827]">WHO Adult BMI</span>
                </div>
                <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB] leading-relaxed">
                  {bmiResult?.description || 'Please provide height and weight to calculate BMI classification.'}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] text-[10px] text-[#9CA3AF]">
                Formula: Weight (kg) ÷ [Height (m)]²
              </div>
            </Card>
          </div>

          {/* Section 2: Clinical Tags (Allergies, Meds, Conditions, Surgeries) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Allergies & Intolerances */}
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                  <span>Critical Allergies ({allergies.length})</span>
                </div>
                <span className="text-[10px] font-medium text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Safety Filter
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Drug and environmental sensitivities used for prescription contraindication screening.
              </p>

              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="e.g. Penicillin, Sulfa, Peanuts..."
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAllergy()
                    }
                  }}
                  className="text-xs h-8 bg-white border-[#E5E7EB]"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddAllergy}
                  className="gap-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 text-xs h-8 px-3"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                {allergies.length > 0 ? (
                  allergies.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => setAllergies(allergies.filter((_, i) => i !== idx))}
                        className="hover:text-red-900 ml-0.5 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic py-0.5">
                    No drug allergies recorded (NKDA).
                  </span>
                )}
              </div>
            </Card>

            {/* 2. Active Medications */}
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5 space-y-3">
              <div className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-[#2563EB]" />
                <span>Active Medications ({medications.length})</span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Current daily prescriptions, dosages, and ongoing therapies.
              </p>

              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="e.g. Lisinopril 10mg daily..."
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddMedication()
                    }
                  }}
                  className="text-xs h-8 bg-white border-[#E5E7EB]"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddMedication}
                  className="gap-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 text-xs h-8 px-3"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                {medications.length > 0 ? (
                  medications.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#374151] text-xs font-medium"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                        className="text-[#9CA3AF] hover:text-[#DC2626] ml-0.5 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic py-0.5">
                    No active medications recorded.
                  </span>
                )}
              </div>
            </Card>

            {/* 3. Chronic Medical Conditions */}
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5 space-y-3">
              <div className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                <FileHeart className="h-4 w-4 text-[#2563EB]" />
                <span>Medical Conditions ({medicalConditions.length})</span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Past and present chronic conditions (e.g. Asthma, Hypertension, GERD).
              </p>

              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="e.g. Hypertension, Type 2 Diabetes..."
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCondition()
                    }
                  }}
                  className="text-xs h-8 bg-white border-[#E5E7EB]"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCondition}
                  className="gap-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 text-xs h-8 px-3"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                {medicalConditions.length > 0 ? (
                  medicalConditions.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#374151] text-xs font-medium"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setMedicalConditions(medicalConditions.filter((_, i) => i !== idx))
                        }
                        className="text-[#9CA3AF] hover:text-[#DC2626] ml-0.5 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#9CA3AF] italic py-0.5">
                    No chronic conditions recorded.
                  </span>
                )}
              </div>
            </Card>

            {/* 4. Past Surgeries & Family History */}
            <Card className="border border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5 space-y-3">
              <div className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                <Scissors className="h-4 w-4 text-[#2563EB]" />
                <span>Surgeries & Family History</span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Past surgical operations and known hereditary predispositions.
              </p>

              {/* Surgeries Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Appendectomy..."
                    value={newSurgery}
                    onChange={(e) => setNewSurgery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSurgery()
                      }
                    }}
                    className="text-xs h-8 bg-white border-[#E5E7EB]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSurgery}
                    className="gap-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 text-xs h-8 px-3"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 min-h-[28px]">
                  {previousSurgeries.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151] text-[11px]"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviousSurgeries(previousSurgeries.filter((_, i) => i !== idx))
                        }
                        className="text-[#9CA3AF] hover:text-[#DC2626]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Family History Input */}
              <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]">
                <div className="text-xs font-medium text-[#374151] flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#6B7280]" />
                  <span>Family Medical History:</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Maternal Hypertension, Diabetes..."
                    value={newFamilyHistory}
                    onChange={(e) => setNewFamilyHistory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddFamilyHistory()
                      }
                    }}
                    className="text-xs h-8 bg-white border-[#E5E7EB]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddFamilyHistory}
                    className="gap-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 text-xs h-8 px-3"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 min-h-[28px]">
                  {familyHistory.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151] text-[11px]"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFamilyHistory(familyHistory.filter((_, i) => i !== idx))
                        }
                        className="text-[#9CA3AF] hover:text-[#DC2626]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Form Action Footer */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-subtle">
            <div className="text-xs text-[#6B7280] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
              <span>All updates persist securely to your electronic health record.</span>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium h-8 px-4"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save changes'}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default HealthProfile
