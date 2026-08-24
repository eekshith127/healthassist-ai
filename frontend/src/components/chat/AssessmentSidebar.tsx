import React, { useState } from 'react'
import {
  Plus,
  Search,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  X,
  Clock,
} from 'lucide-react'
import { Button } from '../ui/button'
import { AssessmentRecord } from '../../types'
import { cn } from '../../utils/cn'

export interface AssessmentSidebarProps {
  history: AssessmentRecord[]
  activeId?: string | number
  onSelectAssessment: (record: AssessmentRecord) => void
  onNewAssessment: () => void
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export const AssessmentSidebar: React.FC<AssessmentSidebarProps> = ({
  history,
  activeId,
  onSelectAssessment,
  onNewAssessment,
  isOpen = true,
  onClose,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHistory = history.filter((item) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      (item.symptoms && item.symptoms.toLowerCase().includes(term)) ||
      (item.id && String(item.id).toLowerCase().includes(term)) ||
      (item.aiSummary && item.aiSummary.toLowerCase().includes(term)) ||
      (item.triageLevel && item.triageLevel.toLowerCase().includes(term))
    )
  })

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 lg:static lg:z-auto w-72 bg-white border-r lg:border border-[#E5E7EB] lg:rounded-xl flex flex-col justify-between p-3.5 shadow-subtle transition-all duration-200 shrink-0 h-full max-h-screen lg:max-h-[calc(100vh-6.5rem)] select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Top Header & Actions */}
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          {/* Header title on mobile */}
          <div className="flex items-center justify-between lg:hidden pb-1 border-b border-[#E5E7EB]">
            <span className="text-xs font-semibold text-[#111827] uppercase tracking-wider">
              Assessment History
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* New Assessment Button */}
          <Button
            onClick={() => {
              onNewAssessment()
              if (onClose) onClose()
            }}
            className="w-full gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New assessment</span>
          </Button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sessions..."
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
            />
          </div>

          {/* Session List */}
          <div className="flex-1 flex flex-col min-h-0 space-y-1">
            <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              <span>Past sessions</span>
              <span className="font-mono text-[10px] text-[#9CA3AF]">
                {filteredHistory.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
              {filteredHistory.length === 0 ? (
                <div className="p-6 text-center text-[#9CA3AF] space-y-1.5">
                  <MessageSquare className="h-5 w-5 mx-auto opacity-50" />
                  <p className="text-xs">No assessments found</p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const isActive = String(item.id) === String(activeId)
                  const triage = item.triageLevel || item.triage_level || 'non-urgent'

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectAssessment(item)
                        if (onClose) onClose()
                      }}
                      className={cn(
                        'w-full text-left p-2.5 rounded-lg transition-colors border text-xs group relative',
                        isActive
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                          : 'bg-white hover:bg-[#F9FAFB] border-[#E5E7EB] text-[#374151]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-[#6B7280] truncate">
                          {String(item.id).startsWith('HA-') ? item.id : `#${item.id}`}
                        </span>

                        <span
                          className={cn(
                            'text-[9px] px-1.5 py-0.2 rounded font-medium',
                            triage === 'emergency'
                              ? 'bg-red-50 text-[#DC2626]'
                              : triage === 'urgent'
                              ? 'bg-amber-50 text-[#D97706]'
                              : 'bg-emerald-50 text-[#16A34A]'
                          )}
                        >
                          {triage}
                        </span>
                      </div>

                      <div className="font-medium truncate mt-1 group-hover:text-[#2563EB] transition-colors">
                        {item.symptoms || 'Health assessment session'}
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-[#9CA3AF]">
                        <span>{item.createdAt || item.created_at || 'Recent'}</span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Bottom Multi-LLM Consensus Info */}
        <div className="pt-2 border-t border-[#E5E7EB]">
          <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-1 text-xs text-[#4B5563]">
            <div className="flex items-center gap-1.5 font-semibold text-[#111827] text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Tri-Model Consensus</span>
            </div>
            <p className="text-[10px] text-[#6B7280] leading-tight">
              Llama 3.1 • Gemini Flash • Nemotron 30B
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
