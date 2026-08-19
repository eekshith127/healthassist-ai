import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { HealthCard } from '../components/health/HealthCard'
import { HealthProfile as HealthProfileType } from '../types'
import { fetchHealthProfile, saveHealthProfile } from '../services/profileService'
import { calculateBMI, calculateAge, formatHeight, formatWeight } from '../utils/bmi'

export const HealthProfile: React.FC = () => {
  const [profile, setProfile] = useState<HealthProfileType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  // Form Field States
  const [dob, setDob] = useState('1994-05-14')
  const [sex, setSex] = useState('male')
  const [heightCm, setHeightCm] = useState<number>(180)
  const [weightKg, setWeightKg] = useState<number>(75)
  const [bloodGroup, setBloodGroup] = useState('O+')

  // List States
  const [medicalConditions, setMedicalConditions] = useState<string[]>([])
  const [medications, setMedications] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [previousSurgeries, setPreviousSurgeries] = useState<string[]>([])
  const [familyHistory, setFamilyHistory] = useState<string[]>([])

  // Temp Inputs for Adding Items
  const [newCondition, setNewCondition] = useState('')
  const [newMedication, setNewMedication] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [newSurgery, setNewSurgery] = useState('')
  const [newFamilyHistory, setNewFamilyHistory] = useState('')

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load Profile
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const data = await fetchHealthProfile()
        setProfile(data)
        if (data.dateOfBirth) setDob(data.dateOfBirth.split('T')[0])
        if (data.sex) setSex(data.sex.toLowerCase())
        if (data.heightCm) setHeightCm(data.heightCm)
        if (data.weightKg) setWeightKg(data.weightKg)
        if (data.bloodGroup) setBloodGroup(data.bloodGroup)
        setMedicalConditions(data.medicalConditions || [])
        setMedications(data.medications || [])
        setAllergies(data.allergies || [])
        setPreviousSurgeries(data.previousSurgeries || [])
        setFamilyHistory(data.familyHistory || [])
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Dynamic calculations
  const bmiResult = calculateBMI(heightCm, weightKg)
  const ageResult = calculateAge(dob)

  // Current consolidated preview object
  const currentProfilePreview: HealthProfileType = {
    ...profile,
    dateOfBirth: dob,
    sex,
    heightCm,
    weightKg,
    bloodGroup,
    medicalConditions,
    medications,
    allergies,
    previousSurgeries,
    familyHistory,
    bmi: bmiResult?.bmi,
    bmiCategory: bmiResult?.category,
    age: ageResult ?? undefined,
    profileCompleted: Boolean(dob && sex && heightCm && weightKg && bloodGroup),
  }

  // Add Item Handlers
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

  // Validate & Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!dob) newErrors.dob = 'Date of birth is required'
    if (!heightCm || heightCm < 40 || heightCm > 260) {
      newErrors.height = 'Valid height (40 - 260 cm) is required'
    }
    if (!weightKg || weightKg < 20 || weightKg > 400) {
      newErrors.weight = 'Valid weight (20 - 400 kg) is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSaving(true)

    try {
      const updated = await saveHealthProfile({
        dateOfBirth: dob,
        sex,
        heightCm,
        weightKg,
        bloodGroup,
        medicalConditions,
        medications,
        allergies,
        previousSurgeries,
        familyHistory,
      })

      setProfile(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading your secure Health Profile...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileHeart className="h-6 w-6 text-emerald-600" />
            <span>Health Profile & Electronic Medical Record</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Persistent biometric context, prescription histories, and critical allergies for automated triage baseline.
          </p>
        </div>

        {/* View Switcher Tabs (Desktop / Mobile) */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'editor'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            <span>Health Card Preview</span>
          </button>
        </div>
      </div>

      {/* Privacy-Conscious Notice Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-3.5 shadow-xs">
        <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
          <Lock className="h-4 w-4" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-2">
            <span>Persistent Context & Privacy-Guarded AI Architecture</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
              HIPAA Minimization Standard
            </span>
          </div>
          <p className="text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
            Your Health Profile serves as persistent baseline context so you don't need to re-type conditions during every consultation. In accordance with clinical privacy standards, your full raw profile is <strong>never broadcast to LLMs</strong>. Only specific contraindicating allergies and relevant conditions are filtered into a minimal <code className="font-mono bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded">PatientCase</code>.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-between border border-emerald-500 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5" />
            <div className="text-xs font-semibold">
              Health Profile successfully updated and synchronized to your persistent EHR!
            </div>
          </div>
          <span className="text-[11px] opacity-80">All calculated metrics refreshed</span>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'preview' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-white">Emergency Health Card View</h3>
            <p className="text-xs text-slate-500">Live preview of your standard digital ID card with updated biometrics.</p>
          </div>
          <HealthCard profile={currentProfilePreview} showActions={true} />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Core Biometrics & Real-Time BMI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Core Form Fields */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span>Core Biometrics & Demographics</span>
                </CardTitle>
                <CardDescription>
                  Fundamental physical metrics used for clinical dosing and baseline reference.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      error={errors.dob}
                    />
                    {ageResult !== null && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        Current Age: <strong className="text-slate-800 dark:text-slate-200">{ageResult} years old</strong>
                      </span>
                    )}
                  </div>

                  {/* Biological Sex */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Biological Sex <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      options={[
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Other / Non-Binary', value: 'other' },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Height */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Height (cm) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={heightCm || ''}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      placeholder="180"
                      error={errors.height}
                    />
                    <span className="text-[11px] text-slate-400">
                      {formatHeight(heightCm)}
                    </span>
                  </div>

                  {/* Weight */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Weight (kg) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={weightKg || ''}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      placeholder="75"
                      error={errors.weight}
                    />
                    <span className="text-[11px] text-slate-400">
                      {formatWeight(weightKg)}
                    </span>
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Blood Group <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      options={[
                        { label: 'O+ (O Positive)', value: 'O+' },
                        { label: 'O- (O Negative - Universal Donor)', value: 'O-' },
                        { label: 'A+ (A Positive)', value: 'A+' },
                        { label: 'A- (A Negative)', value: 'A-' },
                        { label: 'B+ (B Positive)', value: 'B+' },
                        { label: 'B- (B Negative)', value: 'B-' },
                        { label: 'AB+ (AB Positive - Universal Recipient)', value: 'AB+' },
                        { label: 'AB- (AB Negative)', value: 'AB-' },
                        { label: 'Unknown / Not Tested', value: 'UNKNOWN' },
                      ]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Dynamic BMI Gauge Card */}
            <Card className="flex flex-col justify-between border-emerald-500/20 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>Real-Time BMI Calculator</span>
                  </CardTitle>
                  <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    Auto-Computed
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Derived continuously from height ({heightCm} cm) and weight ({weightKg} kg).
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 py-3">
                <div className="text-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner space-y-1">
                  <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {bmiResult?.bmi ?? '—'}
                  </div>
                  <div className={`text-xs font-bold ${bmiResult?.colorClass || 'text-slate-400'}`}>
                    {bmiResult?.category || 'Enter height & weight'}
                  </div>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Reference Standard:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">WHO Adult BMI</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {bmiResult?.description || 'Please provide height and weight to calculate BMI classification.'}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                Formula: Weight (kg) ÷ [Height (m)]²
              </CardFooter>
            </Card>
          </div>

          {/* Section 2: Clinical Tags (Conditions, Meds, Allergies, Surgeries, Family History) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Allergies & Intolerances */}
            <Card className="border-rose-200/80 dark:border-rose-900/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Critical Allergies ({allergies.length})</span>
                  </CardTitle>
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                    Auto-Contraindication
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Active drug and environmental sensitivities used for prescription safety screening.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Penicillin, Latex, Sulfa Drugs..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddAllergy()
                      }
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAllergy}
                    className="gap-1 bg-rose-600 hover:bg-rose-700 text-white shrink-0 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[48px] p-2.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  {allergies.length > 0 ? (
                    allergies.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-2xs"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setAllergies(allergies.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-700 ml-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic py-1">
                      No drug allergies recorded (NKDA).
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Active Medications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Pill className="h-4 w-4 text-emerald-600" />
                  <span>Active Prescriptions & Medications ({medications.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Current daily or PRN prescriptions including exact dosages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Loratadine 10mg Daily, Albuterol..."
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddMedication()
                      }
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddMedication}
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[48px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {medications.length > 0 ? (
                    medications.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium shadow-2xs"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 ml-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic py-1">
                      No active medications recorded.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 3. Chronic Medical Conditions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileHeart className="h-4 w-4 text-emerald-600" />
                  <span>Medical Conditions & Diagnoses ({medicalConditions.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Past and present chronic conditions (e.g. Asthma, Hypertension, GERD).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Asthma, Hypertension, Migraines..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCondition()
                      }
                    }}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCondition}
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[48px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {medicalConditions.length > 0 ? (
                    medicalConditions.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium shadow-2xs"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setMedicalConditions(medicalConditions.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-rose-600 ml-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic py-1">
                      No chronic conditions recorded.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 4. Past Surgeries & Family History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-emerald-600" />
                  <span>Surgeries & Family Medical History</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Surgical history and hereditary predispositions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Surgeries Input */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Previous Surgeries:
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Appendectomy (2016)..."
                      value={newSurgery}
                      onChange={(e) => setNewSurgery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSurgery()
                        }
                      }}
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddSurgery}
                      className="gap-1 bg-slate-800 text-white shrink-0 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {previousSurgeries.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviousSurgeries(previousSurgeries.filter((_, i) => i !== idx))
                          }
                          className="hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Family History Input */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Family Health History:</span>
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
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddFamilyHistory}
                      className="gap-1 bg-slate-800 text-white shrink-0 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {familyHistory.map((f, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFamilyHistory(familyHistory.filter((_, i) => i !== idx))
                          }
                          className="hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Action Footer */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>All updates persist securely to your electronic health database.</span>
            </div>

            <Button
              type="submit"
              isLoading={isSaving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 shadow-md shadow-emerald-600/20"
            >
              <Save className="h-4 w-4" />
              <span>Save & Synchronize Profile</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
