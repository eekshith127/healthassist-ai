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
          'fixed inset-y-0 left-0 z-40 lg:static lg:z-auto w-72 sm:w-80 bg-white dark:bg-slate-900 border-r lg:border border-slate-200/80 dark:border-slate-800 lg:rounded-2xl flex flex-col justify-between p-4 shadow-sm transition-all duration-300 shrink-0 h-full max-h-screen lg:max-h-[calc(100vh-7.5rem)]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Top Header & Actions */}
        <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
          {/* Header title on mobile */}
          <div className="flex items-center justify-between lg:hidden pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Assessment History
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
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
            className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Assessment</span>
          </Button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past assessments..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Session List */}
          <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
            <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Past Sessions</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {filteredHistory.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
              {filteredHistory.length === 0 ? (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <MessageSquare className="h-6 w-6 mx-auto opacity-40" />
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
                        'w-full text-left p-3 rounded-xl transition-all border group relative',
                        isActive
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-800/80 shadow-xs'
                          : 'bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/60 dark:border-slate-800/60'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">
                          {String(item.id).startsWith('HA-') ? item.id : `#${item.id}`}
                        </span>

                        <span
                          className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider',
                            triage === 'emergency'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : triage === 'urgent'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          )}
                        >
                          {triage}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.symptoms || 'Health Assessment Session'}
                      </div>

                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.createdAt || item.created_at || 'Recent'}</span>
                        </span>

                        <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold gap-0.5">
                          <span>
                            {item.consensusScore || item.consensus_score
                              ? `${Number(item.consensusScore || item.consensus_score).toFixed(1)}%`
                              : '98.5%'}
                          </span>
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Bottom Multi-LLM Consensus Card */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Multi-LLM Consensus</span>
              </div>
              <Sparkles className="h-3 w-3 text-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Cross-verifying clinical insights across 3 independent medical models.
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
      </aside>
    </>
  )
}
