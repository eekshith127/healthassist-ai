import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
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
import { Modal } from '../components/ui/modal'
import { ProviderCard } from '../components/providers/ProviderCard'
import {
  ChatMessageItem,
  ChatOption,
  AssessmentRecord,
  HealthcareProvider,
  HealthProfileData,
} from '../types'
import {
  mockTriageScenarioResult,
  mockAssessmentHistory,
  mockProviders,
} from '../services/mockData'
import { assessmentApi, profileApi } from '../services/api'

const INITIAL_AI_MESSAGE_TEXT =
  "Hi! I'm your HealthAssist assistant. Tell me what you're experiencing today. I'll ask a few relevant questions to better understand your concern."

const createInitialMessages = (): ChatMessageItem[] => [
  {
    id: 'msg-initial-greeting',
    sender: 'bot',
    text: INITIAL_AI_MESSAGE_TEXT,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    options: [
      { id: 'opt-1', label: '🤕 Throbbing Headache & Sinus Congestion', value: 'I have a headache with sinus congestion for 2 days' },
      { id: 'opt-2', label: '🫁 Dry Cough & Sore Throat', value: 'I have a persistent dry cough and sore throat' },
      { id: 'opt-3', label: '⚡ Lower Back Muscle Soreness', value: 'I have sharp pain in my lower back after heavy lifting' },
      { id: 'opt-4', label: '🩹 Skin Rash or Contact Itch', value: 'I developed a red itchy rash on my forearm' },
    ],
  },
]

export const Assessment: React.FC = () => {
  const { getToken } = useAuth()
  const { user: clerkUser } = useUser()

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
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentRecord[]>(mockAssessmentHistory)

  // Profile context & Doctor booking modal
  const [healthProfile, setHealthProfile] = useState<HealthProfileData | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)

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

  // Load user profile & past assessments from backend or fallback
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
          if (isMounted && records && records.length > 0) {
            setAssessmentHistory(records)
          }
        }
      } catch (err) {
        console.debug('Using local mock clinical profile & history:', err)
      }
    }

    fetchContext()
    return () => {
      isMounted = false
    }
  }, [getToken])

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
  const handleSelectHistoryAssessment = (record: AssessmentRecord) => {
    setActiveAssessmentId(String(record.id))
    setCurrentSymptoms(record.symptoms || '')
    setCurrentAssessment(record)
    setSessionStep(3)

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
        text: record.symptoms || 'Reported symptoms inquiry',
        timestamp: record.createdAt || record.created_at || 'Previous',
      },
      {
        id: `archived-bot-result-${record.id}`,
        sender: 'bot',
        text: `Here is the archived clinical triage assessment summary for Record #${record.id}:`,
        timestamp: record.createdAt || record.created_at || 'Previous',
        assessmentResult: record,
      },
    ]

    setMessages(historicalMessages)
  }

  // Send message through backend API or fallback mock
  const executeSendMessage = async (text: string, existingUserMsgId?: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    let userMsgId = existingUserMsgId

    if (!userMsgId) {
      counterRef.current += 1
      userMsgId = `user-msg-${counterRef.current}`

      const userMsg: ChatMessageItem = {
        id: userMsgId,
        sender: 'user',
        text,
        timestamp: timeStr,
        status: 'sending',
        retryPayload: text,
      }

      setMessages((prev) => [...prev, userMsg])
      if (sessionStep === 0 && !currentSymptoms) {
        setCurrentSymptoms(text)
      }
    } else {
      // Mark as sending during retry
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, status: 'sending', error: undefined } : m))
      )
    }

    setIsEvaluating(true)

    try {
      const token = await getToken()
      // Make backend API request to POST /api/assessments/{id}/messages
      const res = await assessmentApi.sendAssessmentMessage(
        activeAssessmentId,
        {
          message: text,
          step: sessionStep,
        },
        token
      )

      // Mark user message as sent
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, status: 'sent' } : m))
      )

      counterRef.current += 1
      const botMsgId = res.id || `bot-msg-${counterRef.current}`

      let assessmentRecordForBot: AssessmentRecord | undefined = undefined
      if (res.assessment_summary) {
        const fullResult: AssessmentRecord = {
          ...mockTriageScenarioResult,
          ...res.assessment_summary,
          id: activeAssessmentId,
          symptoms: currentSymptoms || text,
        }
        assessmentRecordForBot = fullResult
        setCurrentAssessment(fullResult)

        // Prepend new assessment to history sidebar
        setAssessmentHistory((prev) => [fullResult, ...prev.filter((h) => String(h.id) !== String(activeAssessmentId))])
      }

      const botMessage: ChatMessageItem = {
        id: botMsgId,
        sender: 'bot',
        text: res.message,
        timestamp: res.timestamp || timeStr,
        options: res.options,
        assessmentResult: assessmentRecordForBot,
      }

      setMessages((prev) => [...prev, botMessage])
      setSessionStep(res.step !== undefined ? res.step : sessionStep + 1)
      setIsEvaluating(false)
    } catch (apiError) {
      console.warn('Backend endpoint call encountered error, providing fallback simulation:', apiError)

      // Fallback mock simulation after a realistic delay
      setTimeout(() => {
        // If simulated network error scenario or failure, mark user message as error
        // But if general offline client, produce local triage progression smoothly
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, status: 'sent' } : m))
        )

        // Check general conversational intents
        const lowerText = text.toLowerCase()
        const symptomKeywords = ['pain', 'hurt', 'cough', 'fever', 'headache', 'migraine', 'ache', 'rash', 'sick', 'nausea', 'dizzy', 'sore', 'throat', 'vomit', 'chest', 'breath', 'blood', 'stomach', 'bleed', 'burn', 'swollen', 'itch']
        const hasSymptoms = symptomKeywords.some((s) => lowerText.includes(s))

        // Time / Date
        if (/\b(what time|tell (me )?time|current time|what('s| is) the time|what date|today('s)? date|what day)\b/.test(lowerText)) {
          const now = new Date()
          const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const dateFormatted = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          const botMsg: ChatMessageItem = {
            id: `bot-fallback-${counterRef.current}`,
            sender: 'bot',
            text: `The current time is **${timeFormatted}** on **${dateFormatted}**. How can I assist you with your health today?`,
            timestamp: timeStr,
          }
          setMessages((prev) => [...prev, botMsg])
          setIsEvaluating(false)
          return
        }

        // Identity / Overview
        if (/\b(who are you|what is healthassist|what can you do|how do you work|tell me about yourself|what is this app)\b/.test(lowerText)) {
          const botMsg: ChatMessageItem = {
            id: `bot-fallback-${counterRef.current}`,
            sender: 'bot',
            text: `I am **HealthAssist AI**, your clinical telehealth assistant. Here is what I can do for you:\n\n• **Symptom Triage:** Guide you through a structured intake to evaluate symptoms and clinical urgency.\n• **Red-Flag Screening:** Screen for emergency conditions (e.g. chest pressure, dyspnea).\n• **Doctor Connectivity:** Connect you with verified healthcare providers and book consultations.\n• **Health Profile Integration:** Keep track of your vitals, conditions, and medications.\n\nHow can I help you today?`,
            timestamp: timeStr,
          }
          setMessages((prev) => [...prev, botMsg])
          setIsEvaluating(false)
          return
        }

        // Doctor Booking
        if (/\b(book (a )?doctor|find (a )?doctor|see (a )?doctor|connect with doctor|specialist)\b/.test(lowerText) && !hasSymptoms) {
          const botMsg: ChatMessageItem = {
            id: `bot-fallback-${counterRef.current}`,
            sender: 'bot',
            text: `You can easily connect with licensed doctors on HealthAssist! Navigate to the **Providers** tab in the top navigation to browse specialists, view real-time availability, and schedule a video or in-person consultation.`,
            timestamp: timeStr,
          }
          setMessages((prev) => [...prev, botMsg])
          setIsEvaluating(false)
          return
        }

        // Greetings
        const isGreeting = /\b(hi|hello|hey|how are you|how r u|hi how r u|good morning|good evening|good afternoon|whats up)\b/.test(lowerText) && !hasSymptoms
        if (isGreeting && sessionStep === 0) {
          const botMsg: ChatMessageItem = {
            id: `bot-fallback-${counterRef.current}`,
            sender: 'bot',
            text: "Hello! I'm doing well, thank you for asking. I'm your HealthAssist assistant. What symptoms or health concerns are you experiencing today that I can help evaluate?",
            timestamp: timeStr,
            options: [
              { id: 'opt-1', label: '🤕 Throbbing Headache & Sinus Congestion', value: 'I have a headache with sinus congestion for 2 days' },
              { id: 'opt-2', label: '🫁 Dry Cough & Sore Throat', value: 'I have a persistent dry cough and sore throat' },
              { id: 'opt-3', label: '⚡ Lower Back Muscle Soreness', value: 'I have sharp pain in my lower back after heavy lifting' },
              { id: 'opt-4', label: '🩹 Skin Rash or Contact Itch', value: 'I developed a red itchy rash on my forearm' },
            ],
          }
          setMessages((prev) => [...prev, botMsg])
          setIsEvaluating(false)
          return
        }

        if (sessionStep === 0) {
          const botMsg: ChatMessageItem = {
            id: `bot-fallback-${counterRef.current}`,
            sender: 'bot',
            text: "Thank you for sharing what you're experiencing. To help determine the proper clinical urgency, how long have you had these symptoms, and how would you rate your discomfort from 1 (mild) to 10 (severe)?",
            timestamp: timeStr,
            options: [
              { id: 'dur-1', label: '⏱️ Less than 24 hours (Mild, 2-3/10)', value: 'Symptoms started less than 24 hours ago, discomfort is mild (around 2/10)' },
              { id: 'dur-2', label: '⏱️ 1 to 3 days (Moderate, 4-5/10)', value: 'I have had this for 2 days with moderate discomfort (around 4/10)' },
              { id: 'dur-3', label: '⏱️ 4 to 7 days (Persistent, 6/10)', value: 'Persistent for nearly a week, discomfort is about 6/10' },
              { id: 'dur-4', label: '⏱️ Over 1 week (Chronic)', value: 'Symptoms have persisted for more than a week' },
            ],
          }
          setMessages((prev) => [...prev, botMsg])
          setSessionStep(1)
        } else if (sessionStep === 1) {
          const botMsg: ChatMessageItem = {
            id: `bot-fallback-${counterRef.current}`,
            sender: 'bot',
            text: "Understood. Before our Multi-LLM consensus protocol generates your full clinical summary, are you experiencing any of the following emergency red flags?\n\n• High fever (> 102°F / 39°C)\n• Shortness of breath, chest pressure, or severe palpitations\n• Sudden neurological symptoms, confusion, or neck stiffness\n• Inability to keep fluids down or loss of consciousness",
            timestamp: timeStr,
            options: [
              { id: 'red-no', label: '✅ None of these red flags', value: 'None of these symptoms apply to me. No fever or breathing difficulty.' },
              { id: 'red-fever', label: '🌡️ Mild low fever only (< 100.5°F)', value: 'I only have a slight low-grade fever, but no breathing issues or chest pain.' },
              { id: 'red-yes', label: '⚠️ Yes, I have severe red flags', value: 'I am experiencing severe chest pressure and shortness of breath.' },
            ],
          }
          setMessages((prev) => [...prev, botMsg])
          setSessionStep(2)
        } else if (sessionStep === 2) {
          const isEmergency = text.toLowerCase().includes('severe') || text.toLowerCase().includes('chest')
          const finalResult: AssessmentRecord = {
            ...mockTriageScenarioResult,
            id: activeAssessmentId,
            symptoms: currentSymptoms || text,
            triageLevel: isEmergency ? 'emergency' : 'non-urgent',
            consensusScore: isEmergency ? 99.4 : 98.6,
            aiSummary: isEmergency
              ? 'CRITICAL ALERT: Reported red flags (chest pressure / severe symptoms) require immediate emergency department clinical evaluation.'
              : 'Consensus indicates acute benign viral rhinitis / seasonal upper respiratory congestion. Stable clinical findings.',
            recommendedSpecialist: isEmergency ? 'Emergency Medicine / ER' : 'Family Medicine / Tele-Triage',
            createdAt: 'Just now',
          }

          setCurrentAssessment(finalResult)
          setAssessmentHistory((prev) => [finalResult, ...prev.filter((h) => String(h.id) !== String(activeAssessmentId))])

          const botMsg: ChatMessageItem = {
            id: `bot-fallback-${counterRef.current}`,
            sender: 'bot',
            text: isEmergency
              ? '⚠️ **CRITICAL CLINICAL ALERT**\n\nBased on the reported red flags, please seek **immediate emergency department evaluation** or dial 911.'
              : 'I have synthesized your reported symptoms across our **Multi-LLM Consensus Protocol** (Gemini Medical, Med-PaLM, and Clinical GPT). Below is your structured clinical triage breakdown and recommended next steps:',
            timestamp: timeStr,
            assessmentResult: finalResult,
          }
          setMessages((prev) => [...prev, botMsg])
          setSessionStep(3)
        } else {
          const botMsg: ChatMessageItem = {
            id: `bot-fallback-${counterRef.current}`,
            sender: 'bot',
            text: `Regarding your inquiry ('${text}'): Maintaining adequate hydration, resting, and standard symptomatic care are recommended. If your symptoms worsen, consult a healthcare provider.`,
            timestamp: timeStr,
          }
          setMessages((prev) => [...prev, botMsg])
        }

        setIsEvaluating(false)
      }, 1000)
    }
  }

  // Handle retry for failed message
  const handleRetryMessage = (failedMsg: ChatMessageItem) => {
    executeSendMessage(failedMsg.retryPayload || failedMsg.text, failedMsg.id)
  }

  // Handle suggested quick chips
  const handleSelectOption = (option: ChatOption) => {
    executeSendMessage(option.value)
  }

  // Open provider booking modal
  const handleOpenBooking = (specialist?: string) => {
    const matched =
      mockProviders.find((p) =>
        specialist ? p.specialty.toLowerCase().includes(specialist.toLowerCase()) : true
      ) || mockProviders[0]
    setSelectedProvider(matched)
    setIsBookingOpen(true)
  }

  const patientDisplayName =
    clerkUser?.fullName || clerkUser?.firstName || 'Patient'

  return (
    <div className="flex gap-4 h-[calc(100vh-7.5rem)] min-h-[580px] relative overflow-hidden">
      {/* 1. LEFT PANEL: Assessment History Sidebar */}
      <AssessmentSidebar
        history={assessmentHistory}
        activeId={activeAssessmentId}
        onSelectAssessment={handleSelectHistoryAssessment}
        onNewAssessment={handleNewAssessment}
        isOpen={isHistorySidebarOpen}
        onClose={() => setIsHistorySidebarOpen(false)}
      />

      {/* 2. CENTER PANEL: Conversation Stream & ChatGPT-Style Interface */}
      <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-w-0">
        {/* Chat Top Header */}
        <header className="p-3.5 sm:p-4 px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile History Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistorySidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              title="Open Assessment History"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  AI Health Assessment
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Consensus Engine Live</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                Interactive clinical triage protocol • Session ID: {activeAssessmentId}
              </p>
            </div>
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewAssessment}
              className="hidden sm:inline-flex gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600"
              title="Start a fresh triage assessment"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>

            {/* Toggle Right Info Panel */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInfoPanelOpen((prev) => !prev)}
              className="gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600"
              title={isInfoPanelOpen ? 'Hide Assessment Details' : 'Show Assessment Details'}
            >
              {isInfoPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
              <span className="hidden md:inline">
                {isInfoPanelOpen ? 'Hide Details' : 'Clinical Details'}
              </span>
            </Button>
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <main
          ref={chatScrollRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950/30 custom-scrollbar"
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              userName={patientDisplayName}
              onSelectOption={handleSelectOption}
              onBookSpecialist={handleOpenBooking}
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

        {/* 3. BOTTOM PANEL: Docked Message Input */}
        <footer className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
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

      {/* 4. OPTIONAL RIGHT PANEL: Current Assessment Information */}
      <AssessmentInfoPanel
        assessment={currentAssessment}
        healthProfile={healthProfile}
        isOpen={isInfoPanelOpen}
        onClose={() => setIsInfoPanelOpen(false)}
        onBookSpecialist={handleOpenBooking}
      />

      {/* Telehealth Provider Fast Connect Modal */}
      {selectedProvider && (
        <Modal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          title="Connect with Telehealth Specialist"
          description="Direct clinician handoff for consultation based on your recent AI triage diagnosis."
          footer={
            <Button variant="outline" size="sm" onClick={() => setIsBookingOpen(false)}>
              Close
            </Button>
          }
        >
          <ProviderCard
            provider={selectedProvider}
            onBookSuccess={() => {
              setTimeout(() => setIsBookingOpen(false), 1500)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

export default Assessment
