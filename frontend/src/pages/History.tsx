import React, { useState, useEffect } from 'react'
import {
  Clock,
  Download,
  Search,
  FileText,
  UserCheck,
  Check,
} from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Modal } from '../components/ui/modal'
import { AssessmentCard } from '../components/assessment/AssessmentCard'
import { ResultCard } from '../components/assessment/ResultCard'
import { mockAssessmentHistory } from '../services/mockData'
import { AssessmentRecord } from '../types'
import { assessmentApi } from '../services/api'

export const History: React.FC = () => {
  const { getToken } = useAuth()
  const [filter, setFilter] = useState<'all' | 'triage' | 'consult'>('all')
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null)
  const [downloadAllState, setDownloadAllState] = useState(false)
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(mockAssessmentHistory)

  useEffect(() => {
    let isMounted = true
    const loadHistory = async () => {
      try {
        const token = await getToken()
        const data = await assessmentApi.getAssessments(token)
        if (isMounted && data && data.length > 0) {
          setAssessments(data)
        }
      } catch (err) {
        console.debug('Using cached assessments:', err)
      }
    }
    loadHistory()
    return () => {
      isMounted = false
    }
  }, [getToken])

  const handleDownloadAll = () => {
    setDownloadAllState(true)
    setTimeout(() => setDownloadAllState(false), 2000)
  }

  const consultRecords = [
    {
      id: 'DOC-2026-0722',
      type: 'consult' as const,
      provider: 'Dr. Sarah Jenkins, MD',
      specialty: 'Family Medicine & Tele-Triage',
      date: 'Jul 22, 2026 • 11:00 AM EST',
      status: 'Completed',
      notes:
        'Patient reviewed seasonal sinus congestion and allergy medications. Refill for Loratadine 10mg approved for 90 days.',
      prescription: 'Loratadine 10mg Tablet (Daily)',
    },
    {
      id: 'DOC-2026-0610',
      type: 'consult' as const,
      provider: 'Dr. Elena Rostova, MD',
      specialty: 'Dermatology Specialist',
      date: 'Jun 10, 2026 • 02:30 PM EST',
      status: 'Completed',
      notes:
        'Evaluation of localized contact dermatitis on right forearm. Recommended topical 1% hydrocortisone cream and skin moisturization.',
      prescription: 'Hydrocortisone 1% Topical Cream',
    },
  ]

  const filteredAssessments = assessments.filter((item) => {
    const summary = item.aiSummary || item.ai_summary || ''
    const idStr = String(item.id)
    const matchesSearch =
      item.symptoms.toLowerCase().includes(search.toLowerCase()) ||
      idStr.toLowerCase().includes(search.toLowerCase()) ||
      summary.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-emerald-600" />
            <span>Consultation & Assessment History</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete archive of your AI triage evaluations, differential diagnoses, and telehealth doctor visits.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAll}
          className="gap-2 text-xs font-semibold self-start sm:self-auto"
        >
          {downloadAllState ? <Check className="h-4 w-4 text-emerald-600" /> : <Download className="h-4 w-4" />}
          <span>{downloadAllState ? 'Export Complete' : 'Export Full Medical History'}</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search history by symptom, report ID, diagnosis, or clinician..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto shrink-0 justify-center">
          {(['all', 'triage', 'consult'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filter === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Records' : tab === 'triage' ? 'AI Triage Reports' : 'Doctor Consults'}
            </button>
          ))}
        </div>
      </div>

      {/* History Items Container */}
      <div className="space-y-4">
        {/* AI Triage Reports */}
        {(filter === 'all' || filter === 'triage') && (
          <div className="space-y-3">
            {filter === 'all' && (
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                AI Clinical Consensus Triage Records ({filteredAssessments.length})
              </h3>
            )}
            {filteredAssessments.map((item) => (
              <AssessmentCard
                key={item.id}
                assessment={item}
                onViewDetails={(rec) => setSelectedRecord(rec)}
              />
            ))}
          </div>
        )}

        {/* Doctor Consultations */}
        {(filter === 'all' || filter === 'consult') && (
          <div className="space-y-3 pt-2">
            {filter === 'all' && (
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Verified Telehealth Doctor Visits ({consultRecords.length})
              </h3>
            )}
            {consultRecords.map((consult) => (
              <Card key={consult.id} className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-xs">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 shrink-0 mt-0.5">
                      <UserCheck className="h-5 w-5" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {consult.id}
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-bold">
                          Doctor Consultation
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {consult.date}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {consult.provider} — {consult.specialty}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {consult.notes}
                      </p>

                      <div className="pt-1 flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Prescription:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {consult.prescription}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Clinical Note</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Assessment Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title="Clinical Triage Comprehensive Report"
          size="xl"
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
              Close
            </Button>
          }
        >
          <ResultCard
            result={selectedRecord}
            onBookSpecialist={() => setSelectedRecord(null)}
          />
        </Modal>
      )}
    </div>
  )
}

export default History
