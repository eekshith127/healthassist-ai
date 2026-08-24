import React, { useState, useEffect } from 'react'
import {
  Clock,
  Download,
  Search,
  Check,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Stethoscope,
} from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Modal } from '../components/ui/modal'
import { AssessmentCard } from '../components/assessment/AssessmentCard'
import { ResultCard } from '../components/assessment/ResultCard'
import { AssessmentRecord } from '../types'
import { assessmentApi } from '../services/api'

export const History: React.FC = () => {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null)
  const [downloadAllState, setDownloadAllState] = useState(false)
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (token) {
        const data = await assessmentApi.getAssessments(token)
        setAssessments(data || [])
      } else {
        setAssessments([])
      }
    } catch (err: any) {
      console.error('History load error:', err)
      setError('Unable to load your data right now.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [getToken])

  const handleDownloadAll = () => {
    setDownloadAllState(true)
    setTimeout(() => setDownloadAllState(false), 2000)
  }

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
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#111827] leading-tight">
            Assessment History
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Review past triage sessions, consensus ratings, and reopened clinical summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/assessment')}
            className="gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium h-8 px-3"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>New assessment</span>
          </Button>

          {assessments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              className="gap-1.5 text-xs h-8 px-3 border-[#E5E7EB]"
            >
              {downloadAllState ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Download className="h-3.5 w-3.5" />}
              <span>{downloadAllState ? 'Exported' : 'Export'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      {assessments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9CA3AF]" />
            <Input
              placeholder="Search by symptoms, condition, or session ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9 bg-white border-[#E5E7EB]"
            />
          </div>
        </div>
      )}

      {/* Content Stream */}
      {isLoading ? (
        <div className="p-12 text-center rounded-xl bg-white border border-[#E5E7EB] space-y-2 shadow-subtle">
          <RefreshCw className="h-5 w-5 animate-spin text-[#2563EB] mx-auto" />
          <p className="text-xs text-[#6B7280]">Loading assessments...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center rounded-xl bg-white border border-red-200 space-y-3 shadow-subtle">
          <AlertCircle className="h-6 w-6 text-[#DC2626] mx-auto" />
          <h3 className="font-medium text-[#111827] text-sm">{error}</h3>
          <Button variant="outline" size="sm" onClick={loadHistory} className="text-xs h-8 px-3 border-[#E5E7EB]">
            Try Again
          </Button>
        </div>
      ) : assessments.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-[#E5E7EB] space-y-3 shadow-subtle">
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-[#111827]">No assessments yet.</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Start an AI health assessment to evaluate your symptoms with our clinical consensus engine.
            </p>
          </div>
          <Button
            onClick={() => navigate('/assessment')}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium gap-1.5 h-8 px-3"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Start assessment</span>
          </Button>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-[#E5E7EB] space-y-2 shadow-subtle">
          <p className="text-xs text-[#6B7280]">No assessments match your search query.</p>
          <Button variant="outline" size="sm" onClick={() => setSearch('')} className="text-xs h-8 px-3 border-[#E5E7EB]">
            Clear search
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAssessments.map((item) => (
            <AssessmentCard
              key={item.id}
              assessment={item}
              onViewDetails={(rec) => setSelectedRecord(rec)}
            />
          ))}
        </div>
      )}

      {/* Clinical Assessment Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title="Clinical Assessment Report"
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="h-8 px-3 border-[#E5E7EB] text-xs">
                Close
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const recId = selectedRecord.id
                  setSelectedRecord(null)
                  navigate(`/assessment?id=${recId}`)
                }}
                className="gap-1.5 text-xs bg-[#2563EB] text-white hover:bg-[#1D4ED8] h-8 px-3"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Reopen conversation</span>
              </Button>
            </div>
          }
        >
          <ResultCard result={selectedRecord} />
        </Modal>
      )}
    </div>
  )
}

export default History
