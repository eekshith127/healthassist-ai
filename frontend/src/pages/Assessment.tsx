import React, { useState, useRef, useEffect } from 'react'
import {
  Stethoscope,
  Plus,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { ChatMessage } from '../components/chat/ChatMessage'
import { ChatInput } from '../components/chat/ChatInput'
import { Button } from '../components/ui/button'
import { Modal } from '../components/ui/modal'
import { ProviderCard } from '../components/providers/ProviderCard'
import {
  ChatMessageItem,
  ChatOption,
  AssessmentRecord,
  HealthcareProvider,
} from '../types'
import {
  mockInitialChatMessages,
  mockTriageScenarioResult,
  mockAssessmentHistory,
  mockProviders,
} from '../services/mockData'

export const Assessment: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageItem[]>(mockInitialChatMessages)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [sessionStep, setSessionStep] = useState<number>(0)
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef(100)

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, isEvaluating])

  const handleSendMessage = (text: string) => {
    counterRef.current += 1
    const userMsg: ChatMessageItem = {
      id: `user-${counterRef.current}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    }

    setMessages((prev) => [...prev, userMsg])
    processNextTriageStep(text)
  }

  const handleSelectOption = (option: ChatOption) => {
    handleSendMessage(option.value)
  }

  const processNextTriageStep = (userText: string) => {
    setIsEvaluating(true)

    // Simulate multi-turn intelligent clinical triage responses
    setTimeout(() => {
      counterRef.current += 1
      if (sessionStep === 0) {
        // Step 1: Inquire about duration & pain scale
        const botResponse: ChatMessageItem = {
          id: `bot-${counterRef.current}`,
          sender: 'bot',
          text: `Thank you for sharing. How long have you had these symptoms, and what is your approximate discomfort level on a scale from 1 (mild) to 10 (severe)?`,
          timestamp: 'Just now',
          options: [
            { id: 'dur-1', label: '⏱️ Less than 24 hours (Mild, 2-3/10)', value: 'Symptoms started less than 24 hours ago, discomfort is mild (around 2/10)' },
            { id: 'dur-2', label: '⏱️ 1 to 3 days (Moderate, 4-5/10)', value: 'I have had this for 2 days with moderate discomfort (around 4/10)' },
            { id: 'dur-3', label: '⏱️ 4 to 7 days (Persistent, 6/10)', value: 'Persistent for nearly a week, discomfort is about 6/10' },
            { id: 'dur-4', label: '⏱️ Over 1 week (Chronic)', value: 'Symptoms have persisted for more than a week' },
          ],
        }
        setMessages((prev) => [...prev, botResponse])
        setSessionStep(1)
        setIsEvaluating(false)
      } else if (sessionStep === 1) {
        // Step 2: Inquire about red flag safety exclusions
        const botResponse: ChatMessageItem = {
          id: `bot-${counterRef.current}`,
          sender: 'bot',
          text: `Understood. Before our Multi-LLM consensus protocol generates your triage report, are you experiencing any of the following emergency red flags?\n\n• High fever (> 102°F / 39°C)\n• Shortness of breath or chest pressure\n• Severe sudden neurological symptoms or neck stiffness\n• Unexplained confusion or loss of consciousness`,
          timestamp: 'Just now',
          options: [
            { id: 'red-no', label: '✅ None of these red flags', value: 'None of these symptoms apply to me. No fever or breathing difficulty.' },
            { id: 'red-fever', label: '🌡️ Mild fever only (< 100°F)', value: 'I only have a slight low-grade fever, but no breathing issues or chest pain.' },
            { id: 'red-yes', label: '⚠️ Yes, I have severe red flags', value: 'I am experiencing severe chest pressure and high fever.' },
          ],
        }
        setMessages((prev) => [...prev, botResponse])
        setSessionStep(2)
        setIsEvaluating(false)
      } else {
        // Step 3: Run consensus & generate final clinical ResultCard
        const isEmergency = userText.toLowerCase().includes('severe') || userText.toLowerCase().includes('chest')

        const finalResult: AssessmentRecord = isEmergency
          ? {
              ...mockTriageScenarioResult,
              id: `HA-2026-LIVE-${counterRef.current}`,
              symptoms: userText,
              triageLevel: 'emergency',
              consensusScore: 99.4,
              aiSummary:
                'CRITICAL ALERT: Reported red flags (chest pressure / severe symptoms) require immediate emergency department or 911 clinical evaluation.',
              recommendedSpecialist: 'Emergency Medicine / ER',
            }
          : {
              ...mockTriageScenarioResult,
              id: `HA-2026-LIVE-${counterRef.current}`,
              symptoms: 'Mild fronto-temporal headache with nasal stuffiness and slight fatigue for 2 days. Discomfort rated 3/10.',
              triageLevel: 'non-urgent',
              consensusScore: 98.7,
            }

        const botFinalResponse: ChatMessageItem = {
          id: `bot-${counterRef.current}`,
          sender: 'bot',
          text: `I have synthesized your symptoms through our Multi-LLM Consensus Protocol (Gemini Medical, Med-PaLM, and Clinical GPT). Below is your structured clinical triage breakdown and recommended next steps:`,
          timestamp: 'Just now',
          assessmentResult: finalResult,
        }

        setMessages((prev) => [...prev, botFinalResponse])
        setSessionStep(3)
        setIsEvaluating(false)
      }
    }, 1200)
  }

  const handleResetChat = () => {
    setMessages(mockInitialChatMessages)
    setSessionStep(0)
    setIsEvaluating(false)
  }

  const handleOpenBooking = (specialist?: string) => {
    const matched = mockProviders.find((p) =>
      specialist ? p.specialty.toLowerCase().includes(specialist.toLowerCase()) : true
    ) || mockProviders[0]
    setSelectedProvider(matched)
    setIsBookingOpen(true)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7.5rem)] min-h-[600px]">
      {/* Left Sidebar: Session Archive & Multi-LLM Protocol Info */}
      <div className="hidden lg:flex w-72 flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm shrink-0">
        <div className="space-y-4">
          <Button
            onClick={handleResetChat}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>New Triage Session</span>
          </Button>

          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Previous Assessments
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[320px]">
              {mockAssessmentHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setMessages([
                      {
                        id: `archived-${item.id}`,
                        sender: 'bot',
                        text: `Reviewing historical assessment record:`,
                        timestamp: item.createdAt,
                        assessmentResult: item,
                      },
                    ])
                    setSessionStep(3)
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group text-left"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-slate-400">{item.id}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {item.consensusScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 group-hover:text-emerald-600">
                    {item.symptoms}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.createdAt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Model consensus protocol badge */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Consensus Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            3 Independent Medical Models cross-verify every differential diagnosis before clinical recommendation.
          </p>
          <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
            <span>Gemini Med</span>
            <span>•</span>
            <span>Med-PaLM</span>
            <span>•</span>
            <span>GPT-Med</span>
          </div>
        </div>
      </div>

      {/* Main ChatGPT-Style Chat Container */}
      <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Chat Top Header */}
        <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Clinical AI Triage Assistant
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Multi-LLM Live</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Interactive clinical triage protocol with differential reasoning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>EHR Baseline Context Active</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetChat}
              className="gap-1.5 text-xs text-slate-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset Session</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Conversation Stream */}
        <div
          ref={chatScrollRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950/30"
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSelectOption={handleSelectOption}
              onBookSpecialist={handleOpenBooking}
            />
          ))}

          {/* Evaluating loader message */}
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
        </div>

        {/* Docked Prompt Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isEvaluating}
            placeholder={
              sessionStep === 3
                ? 'Ask a follow-up question about this diagnosis or medications...'
                : 'Describe your symptoms, pain location, or onset timeline...'
            }
          />
        </div>
      </div>

      {/* Provider Booking Modal */}
      {selectedProvider && (
        <Modal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          title="Connect with Telehealth Specialist"
          description={`Direct clinician handoff for consultation based on your recent AI triage diagnosis.`}
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
