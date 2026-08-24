import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useSearchParams } from 'react-router-dom'
import {
  Stethoscope,
  Sparkles,
  PanelRight,
  PanelRightClose,
  Menu,
  RotateCcw,
} from 'lucide-react'
import { ChatMessage } from '../components/chat/ChatMessage'
import { ChatInput } from '../components/chat/ChatInput'
import { AssessmentSidebar } from '../components/chat/AssessmentSidebar'
import { AssessmentInfoPanel } from '../components/chat/AssessmentInfoPanel'
import { Button } from '../components/ui/button'
import {
  ChatMessageItem,
  ChatOption,
  AssessmentRecord,
  HealthProfileData,
} from '../types'
import { assessmentApi, profileApi } from '../services/api'

const INITIAL_AI_MESSAGE_TEXT =
  "Tell me what symptoms or health concerns you're experiencing today. I'll evaluate them using our tri-model clinical consensus protocol."

const createInitialMessages = (): ChatMessageItem[] => [
  {
    id: 'msg-initial-greeting',
    sender: 'bot',
    text: INITIAL_AI_MESSAGE_TEXT,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    options: [
      { id: 'opt-1', label: 'Throbbing headache & sinus pressure', value: 'I have a headache with sinus congestion for 2 days' },
      { id: 'opt-2', label: 'Persistent dry cough & sore throat', value: 'I have a persistent dry cough and sore throat' },
      { id: 'opt-3', label: 'Lower back muscle soreness', value: 'I have sharp pain in my lower back after heavy lifting' },
      { id: 'opt-4', label: 'Skin rash or contact itch', value: 'I developed a red itchy rash on my forearm' },
    ],
  },
]

export const Assessment: React.FC = () => {
  const { getToken } = useAuth()
  const { user: clerkUser } = useUser()
  const [searchParams] = useSearchParams()

  // Session & conversation state
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>(
    () => `HA-2026-LIVE-${Math.floor(1000 + Math.random() * 9000)}`
  )

  const [messages, setMessages] = useState<ChatMessageItem[]>(createInitialMessages)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [sessionStep, setSessionStep] = useState<number>(0)
  const [currentSymptoms, setCurrentSymptoms] = useState<string>('')
  const [currentAssessment, setCurrentAssessment] = useState<Partial<AssessmentRecord> | null>(null)

  // Sidebars & panels visibility
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false)
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true)
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentRecord[]>([])

  // Profile context
  const [healthProfile, setHealthProfile] = useState<HealthProfileData | null>(null)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef(100)

  // Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior,
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages, isEvaluating, scrollToBottom])

  // Load user profile & past assessments from backend Supabase
  useEffect(() => {
    let isMounted = true

    const fetchContext = async () => {
      try {
        const token = await getToken()
        if (token) {
          const profile = await profileApi.getProfile(token)
          if (isMounted && profile) {
            setHealthProfile(profile)
          }

          const records = await assessmentApi.getAssessments(token)
          if (isMounted && records) {
            setAssessmentHistory(records)
          }
        }
      } catch (err) {
        console.debug('Context fetch error:', err)
      }
    }

    fetchContext()
    return () => {
      isMounted = false
    }
  }, [getToken, clerkUser?.id])

  // Handle URL parameter ?id=... to auto-load historical assessment and real messages
  useEffect(() => {
    const targetId = searchParams.get('id')
    if (targetId && assessmentHistory.length > 0) {
      const match = assessmentHistory.find(
        (rec) => String(rec.id) === targetId || String(rec.id).toLowerCase() === targetId.toLowerCase()
      )
      if (match) {
        handleSelectHistoryAssessment(match)
      }
    }
  }, [searchParams, assessmentHistory])

  // Start a fresh assessment session
  const handleNewAssessment = () => {
    const newId = `HA-2026-LIVE-${Math.floor(1000 + Math.random() * 9000)}`
    setActiveAssessmentId(newId)
    setMessages(createInitialMessages())
    setSessionStep(0)
    setCurrentSymptoms('')
    setCurrentAssessment(null)
    setIsEvaluating(false)
  }

  // Load a historical assessment session
  const handleSelectHistoryAssessment = async (record: AssessmentRecord) => {
    setActiveAssessmentId(String(record.id))
    setCurrentSymptoms(record.symptoms || '')
    setCurrentAssessment(record)
    setSessionStep(3)

    try {
      const token = await getToken()
      const dbMsgs = await assessmentApi.getAssessmentMessages(record.id, token)
      if (dbMsgs && dbMsgs.length > 0) {
        const loaded: ChatMessageItem[] = dbMsgs.map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
        }))
        // Attach result card to the last assistant message
        if (loaded.length > 0) {
          loaded[loaded.length - 1].assessmentResult = record
        }
        setMessages(loaded)
        return
      }
    } catch {
      // fallback to summary reconstruction
    }

    const historicalMessages: ChatMessageItem[] = [
      {
        id: `archived-init-${record.id}`,
        sender: 'bot',
        text: INITIAL_AI_MESSAGE_TEXT,
        timestamp: record.createdAt || record.created_at || 'Previous',
      },
      {
        id: `archived-user-${record.id}`,
        sender: 'user',
        text: record.symptoms,
        timestamp: record.createdAt || record.created_at || 'Previous',
      },
      {
        id: `archived-bot-result-${record.id}`,
        sender: 'bot',
        text: record.aiSummary || record.ai_summary || 'Clinical multi-LLM assessment summary complete.',
        timestamp: record.createdAt || record.created_at || 'Previous',
        assessmentResult: record,
      },
    ]

    setMessages(historicalMessages)
  }

  // Send message through backend API
  const executeSendMessage = async (rawText: string) => {
    const text = rawText.trim()
    if (!text || isEvaluating) return

    counterRef.current += 1
    const currentId = counterRef.current
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMessage: ChatMessageItem = {
      id: `user-msg-${currentId}`,
      sender: 'user',
      text,
      timestamp: userTimestamp,
    }

    setMessages((prev) => [...prev, userMessage])
    if (sessionStep === 0 && !currentSymptoms) {
      setCurrentSymptoms(text)
    }

    setIsEvaluating(true)

    try {
      const token = await getToken()
      const res = await assessmentApi.sendAssessmentMessage(
        activeAssessmentId,
        {
          message: text,
          step: sessionStep,
          severity: currentAssessment?.severity || undefined,
          duration: currentAssessment?.duration || undefined,
        },
        token
      )

      setIsEvaluating(false)

      const botMessage: ChatMessageItem = {
        id: res.id || `bot-msg-${currentId + 1}`,
        sender: 'bot',
        text: res.message,
        timestamp: res.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: res.options,
        step: res.step,
      }

      if (res.assessment_summary) {
        const fullRecord: AssessmentRecord = {
          id: res.assessment_summary.id || activeAssessmentId,
          symptoms: currentSymptoms || text,
          aiSummary: res.assessment_summary.ai_summary || res.assessment_summary.aiSummary,
          consensusScore: res.assessment_summary.consensus_score || res.assessment_summary.consensusScore || 90,
          modelAgreement: res.assessment_summary.modelAgreement || res.assessment_summary.model_agreement || '3/3',
          triageLevel: (res.assessment_summary.triage_level || res.assessment_summary.triageLevel || 'non-urgent') as any,
          recommendedSpecialist: res.assessment_summary.recommended_specialist || res.assessment_summary.recommendedSpecialist || 'General Medicine',
          recommendedAction: res.assessment_summary.recommendedAction || res.assessment_summary.recommended_next_step,
          differentialDiagnoses: res.assessment_summary.differentialDiagnoses || [],
          modelAssessments: res.assessment_summary.modelAssessments || res.assessment_summary.model_assessments || (res.final_assessment && (res.final_assessment as any).model_assessments) || {},
          disagreements: res.assessment_summary.disagreements || [],
          createdAt: 'Just now',
          status: 'active',
        }
        botMessage.assessmentResult = fullRecord
        setCurrentAssessment(fullRecord)
        setAssessmentHistory((prev) => [fullRecord, ...prev.filter((r) => r.id !== fullRecord.id)])
      }

      setSessionStep(res.step ?? sessionStep + 1)
      setMessages((prev) => [...prev, botMessage])
    } catch (err: any) {
      setIsEvaluating(false)
      console.error('Assessment API error:', err)
      const errorMsg: ChatMessageItem = {
        id: `err-msg-${currentId + 1}`,
        sender: 'bot',
        text: 'Unable to communicate with the assessment service right now. Please verify your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'error',
        error: err.message,
        retryPayload: text,
      }
      setMessages((prev) => [...prev, errorMsg])
    }
  }

  const handleSelectOption = (option: ChatOption) => {
    executeSendMessage(option.value || option.label)
  }

  const handleRetryMessage = (failedMsg: ChatMessageItem) => {
    if (failedMsg.retryPayload) {
      setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id))
      executeSendMessage(failedMsg.retryPayload)
    }
  }

  const patientDisplayName = clerkUser?.firstName || 'You'

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-4 animate-in fade-in duration-200 relative max-w-[1500px] mx-auto p-2 sm:p-4">
      {/* 1. LEFT SIDEBAR: History & Sessions */}
      <AssessmentSidebar
        history={assessmentHistory}
        activeId={activeAssessmentId}
        onSelectAssessment={handleSelectHistoryAssessment}
        onNewAssessment={handleNewAssessment}
        isOpen={isHistorySidebarOpen}
        onClose={() => setIsHistorySidebarOpen(false)}
      />

      {/* 2. CENTER PANEL: Interactive Chat Conversation */}
      <div className="flex-1 flex flex-col bg-white border border-[#E5E7EB] rounded-xl shadow-subtle overflow-hidden min-w-0">
        {/* Chat Header */}
        <header className="p-3 sm:p-4 border-b border-[#E5E7EB] bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
              title="Toggle history menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] shrink-0">
              <Stethoscope className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm sm:text-base text-[#111827] tracking-tight truncate">
                  AI Health Assessment
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.2 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]">
                  Tri-Model Consensus
                </span>
              </div>
              <p className="text-xs text-[#6B7280] truncate">
                Session: <span className="font-mono">{activeAssessmentId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewAssessment}
              className="gap-1.5 text-xs text-[#374151] hidden sm:flex h-8 px-3 border-[#E5E7EB]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
              className="gap-1.5 text-xs text-[#6B7280] h-8 px-2.5"
              title="Toggle Clinical Summary"
            >
              {isInfoPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
              <span className="hidden md:inline">
                {isInfoPanelOpen ? 'Hide details' : 'Details'}
              </span>
            </Button>
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <main
          ref={chatScrollRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#F9FAFB] custom-scrollbar"
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              userName={patientDisplayName}
              onSelectOption={handleSelectOption}
              onRetryMessage={handleRetryMessage}
            />
          ))}

          {/* Evaluating Loader Indicator */}
          {isEvaluating && (
            <ChatMessage
              message={{
                id: 'evaluating-loader',
                sender: 'bot',
                text: '',
                timestamp: 'Evaluating...',
                isTyping: true,
              }}
            />
          )}
        </main>

        {/* BOTTOM PANEL: Docked Message Input */}
        <footer className="p-3 sm:p-4 border-t border-[#E5E7EB] bg-white shrink-0">
          <ChatInput
            onSendMessage={(msg) => executeSendMessage(msg)}
            disabled={isEvaluating}
            placeholder={
              sessionStep === 3
                ? 'Ask a follow-up question or inquire about self-care...'
                : 'Describe your symptoms in detail (e.g. headache for 2 days, mild fever)...'
            }
          />
        </footer>
      </div>

      {/* 3. OPTIONAL RIGHT PANEL: Current Assessment Information */}
      <AssessmentInfoPanel
        assessment={currentAssessment}
        healthProfile={healthProfile}
        isOpen={isInfoPanelOpen}
        onClose={() => setIsInfoPanelOpen(false)}
      />
    </div>
  )
}

export default Assessment
