import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { FileHeart, AlertTriangle, Pill, Heart, Shield, Save, Check } from 'lucide-react'

export const HealthProfile: React.FC = () => {
  const [saved, setSaved] = useState(false)
  const [allergies, setAllergies] = useState(['Penicillin', 'Peanuts'])
  const [newAllergy, setNewAllergy] = useState('')
  const [medications, setMedications] = useState([
    { name: 'Loratadine', dosage: '10mg', frequency: 'Daily (Morning)' },
    { name: 'Multivitamin Complex', dosage: '1 capsule', frequency: 'Daily' },
  ])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item))
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileHeart className="h-6 w-6 text-emerald-600" />
            <span>Electronic Health Profile</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal baseline medical history, known allergies, and active prescriptions.
          </p>
        </div>

        <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saved ? 'Changes Saved!' : 'Save Profile'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Biometrics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biometrics & Demographics</CardTitle>
              <CardDescription>Primary indicators used for clinical triage calculations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input id="age" defaultValue="32" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Biological Sex</Label>
                <Input id="gender" defaultValue="Male" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bloodType">Blood Group</Label>
                <Input id="bloodType" defaultValue="O-Positive (O+)" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight & Height</Label>
                <Input id="weight" defaultValue="75 kg • 180 cm (BMI 23.1)" />
              </div>
            </CardContent>
          </Card>

          {/* Allergies & Adverse Reactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Allergies & Sensitivities</span>
                  </CardTitle>
                  <CardDescription>Critically flagged during AI assessment and prescription review</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="destructive"
                    className="px-3 py-1 text-xs gap-1.5 cursor-pointer hover:opacity-80"
                    onClick={() => removeAllergy(allergy)}
                  >
                    <span>{allergy}</span>
                    <span className="text-rose-400 font-bold ml-1">×</span>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add allergy (e.g. Sulfa, Latex)..."
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <Button variant="secondary" onClick={addAllergy} type="button">
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4 text-emerald-600" />
                <span>Current Medications</span>
              </CardTitle>
              <CardDescription>Daily prescriptions and over-the-counter supplements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {medications.map((med, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">
                      {med.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {med.dosage} • {med.frequency}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Emergency Info */}
        <div className="space-y-6">
          <Card className="border-rose-200/70 dark:border-rose-900/40 bg-gradient-to-b from-rose-50/30 to-transparent">
            <CardHeader>
              <CardTitle className="text-sm text-rose-900 dark:text-rose-300 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-600" />
                <span>Emergency Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Primary Contact</Label>
                <Input defaultValue="Sarah Doe (Spouse)" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Emergency Phone</Label>
                <Input defaultValue="+1 (555) 948-2940" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preferred Hospital</Label>
                <Input defaultValue="Central Memorial Telehealth Center" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>HIPAA & Privacy Notice</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 leading-relaxed space-y-2">
              <p>
                Your health data is encrypted end-to-end. AI triage models evaluate symptoms in a sandboxed, anonymized environment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
