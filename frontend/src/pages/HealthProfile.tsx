import React, { useState } from 'react'
import {
  FileHeart,
  AlertTriangle,
  Pill,
  Heart,
  Save,
  Check,
  Plus,
  Trash2,
  Syringe,
  Activity,
  Phone,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Modal } from '../components/ui/modal'
import { mockAllergies, mockMedications, mockCurrentUser } from '../services/mockData'
import { Allergy, Medication } from '../types'

export const HealthProfile: React.FC = () => {
  const [saved, setSaved] = useState(false)
  const [allergies, setAllergies] = useState<Allergy[]>(mockAllergies)
  const [medications, setMedications] = useState<Medication[]>(mockMedications)

  // New allergy state
  const [newSubstance, setNewSubstance] = useState('')
  const [newSeverity, setNewSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate')

  // New medication modal
  const [isMedModalOpen, setIsMedModalOpen] = useState(false)
  const [newMedName, setNewMedName] = useState('')
  const [newMedDosage, setNewMedDosage] = useState('')
  const [newMedFreq, setNewMedFreq] = useState('')
  const [newMedDoctor, setNewMedDoctor] = useState('')

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleAddAllergy = () => {
    if (!newSubstance.trim()) return
    const newAllergyObj: Allergy = {
      id: `all-${Math.random().toString(36).substring(2, 9)}`,
      substance: newSubstance.trim(),
      reaction: 'Patient reported sensitivity',
      severity: newSeverity,
    }
    setAllergies([...allergies, newAllergyObj])
    setNewSubstance('')
  }

  const handleRemoveAllergy = (id: string) => {
    setAllergies(allergies.filter((a) => a.id !== id))
  }

  const handleAddMedication = () => {
    if (!newMedName.trim()) return
    const newMed: Medication = {
      id: `med-${Math.random().toString(36).substring(2, 9)}`,
      name: newMedName.trim(),
      dosage: newMedDosage || 'Standard Dosage',
      frequency: newMedFreq || 'Daily',
      prescribedBy: newMedDoctor || 'Primary Care Provider',
      refillsRemaining: 2,
      active: true,
    }
    setMedications([...medications, newMed])
    setNewMedName('')
    setNewMedDosage('')
    setNewMedFreq('')
    setNewMedDoctor('')
    setIsMedModalOpen(false)
  }

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileHeart className="h-6 w-6 text-emerald-600" />
            <span>Electronic Health Profile</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your baseline clinical biometrics, allergies, active prescriptions, and medical history.
          </p>
        </div>

        <Button onClick={handleSaveAll} className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saved ? 'Profile Saved!' : 'Save Changes'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Biometrics, Allergies & Medications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biometrics & Demographics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span>Biometrics & Vital Indicators</span>
              </CardTitle>
              <CardDescription>
                Primary demographic indicators utilized during Multi-LLM clinical triage calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Legal Name
                </label>
                <Input defaultValue={mockCurrentUser.fullName} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date of Birth & Age
                </label>
                <Input defaultValue="May 14, 1994 (32 yrs)" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Biological Sex
                </label>
                <Select
                  defaultValue="male"
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other / Prefer not to say' },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Blood Group
                </label>
                <Select
                  defaultValue="O+"
                  options={[
                    { value: 'O+', label: 'O-Positive (O+)' },
                    { value: 'O-', label: 'O-Negative (O-)' },
                    { value: 'A+', label: 'A-Positive (A+)' },
                    { value: 'A-', label: 'A-Negative (A-)' },
                    { value: 'B+', label: 'B-Positive (B+)' },
                    { value: 'B-', label: 'B-Negative (B-)' },
                    { value: 'AB+', label: 'AB-Positive (AB+)' },
                    { value: 'AB-', label: 'AB-Negative (AB-)' },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Height & Weight
                </label>
                <Input defaultValue="180 cm (5 ft 11 in) • 75 kg (165 lbs)" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Calculated BMI & Category
                </label>
                <Input defaultValue="23.1 kg/m² (Normal / Healthy Weight)" disabled className="bg-slate-50 dark:bg-slate-800/60" />
              </div>
            </CardContent>
          </Card>

          {/* Allergies & Adverse Reactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <span>Known Allergies & Sensitivities</span>
                  </CardTitle>
                  <CardDescription>
                    Critically cross-checked during triage medication and clinical advice generation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add allergy row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Add substance or allergen (e.g. Sulfa drugs, Codeine)..."
                  value={newSubstance}
                  onChange={(e) => setNewSubstance(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
                <Button
                  type="button"
                  onClick={handleAddAllergy}
                  disabled={!newSubstance.trim()}
                  className="gap-1.5 bg-emerald-600 text-white text-xs shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Allergy</span>
                </Button>
              </div>

              {/* Allergies List */}
              <div className="space-y-2 pt-2">
                {allergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {allergy.substance}
                        </span>
                        <span
                          className={`px-2 py-0.2 text-[10px] font-bold rounded-full uppercase ${
                            allergy.severity === 'severe'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {allergy.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{allergy.reaction}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(allergy.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Remove allergy"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Medications & Prescriptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4 text-emerald-600" />
                    <span>Active Prescriptions & Supplements</span>
                  </CardTitle>
                  <CardDescription>
                    Current pharmacological regimens referenced for contraindications
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsMedModalOpen(true)}
                  className="gap-1.5 text-xs text-emerald-600 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Prescription</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {med.name}
                      </h4>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {med.dosage} • {med.frequency}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Prescribed by {med.prescribedBy} • {med.refillsRemaining} refills remaining
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(med.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors mt-1"
                    title="Remove prescription"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Chronic Conditions, Immunizations & Emergency Contacts */}
        <div className="space-y-6">
          {/* Chronic Conditions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-emerald-600" />
                <span>Chronic Conditions & History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  Mild Exercise-Induced Bronchospasm (Asthma)
                </div>
                <div className="text-slate-500">Diagnosed: 2018 • Controlled via Albuterol PRN</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  Appendectomy (Surgical)
                </div>
                <div className="text-slate-500">Laparoscopic procedure in 2016 • Fully healed</div>
              </div>
            </CardContent>
          </Card>

          {/* Immunization Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Syringe className="h-4 w-4 text-emerald-600" />
                <span>Immunization Record</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">COVID-19 Bivalent</div>
                  <div className="text-[10px] text-slate-400">Sep 2025 • Verified</div>
                </div>
                <Badge variant="default" className="text-[10px]">Up to Date</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Tdap (Tetanus)</div>
                  <div className="text-[10px] text-slate-400">Oct 2021 • Valid 10 yrs</div>
                </div>
                <Badge variant="default" className="text-[10px]">Up to Date</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Influenza (Annual)</div>
                  <div className="text-[10px] text-slate-400">Nov 2025 • Seasonal</div>
                </div>
                <Badge variant="default" className="text-[10px]">Current</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>Emergency Designated Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Contact Name & Relation</label>
                <Input defaultValue="Emily Doe (Spouse)" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Emergency Phone</label>
                <Input defaultValue="+1 (555) 234-8910" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Medication Modal */}
      <Modal
        isOpen={isMedModalOpen}
        onClose={() => setIsMedModalOpen(false)}
        title="Add Prescription / Medication"
        description="Enter medication information to track dosage and safety contraindications."
        footer={
          <div className="flex justify-between w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsMedModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddMedication} className="bg-emerald-600 text-white">
              Add Prescription
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Medication Name
            </label>
            <Input
              placeholder="E.g. Metformin, Lisinopril, Ibuprofen..."
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dosage
              </label>
              <Input
                placeholder="E.g. 500 mg, 10 ml..."
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Frequency
              </label>
              <Input
                placeholder="E.g. Once daily, PRN..."
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prescribing Physician / Clinic
            </label>
            <Input
              placeholder="E.g. Dr. Sarah Jenkins"
              value={newMedDoctor}
              onChange={(e) => setNewMedDoctor(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
