import React, { useState } from 'react'
import { Stethoscope, Copy, Check, Sparkles } from 'lucide-react'
import { ChatMessageItem, ChatOption } from '../../types'
import { ResultCard } from '../assessment/ResultCard'
import { cn } from '../../utils/cn'

export interface ChatMessageProps {
  message: ChatMessageItem
  onSelectOption?: (option: ChatOption) => void
  onBookSpecialist?: (specialty?: string) => void
  className?: string
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectOption,
  onBookSpecialist,
  className,
}) => {
  const [copied, setCopied] = useState(false)
  const isBot = message.sender === 'bot'
  const isUser = message.sender === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'group flex gap-3.5 max-w-4xl mx-auto w-full transition-all duration-200',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isBot ? (
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Stethoscope className="h-5 w-5" />
          </div>
        ) : (
          <div className="h-9 w-9 rounded-2xl bg-slate-800 text-slate-100 flex items-center justify-center font-bold text-xs shadow-sm">
            JD
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div className={cn('space-y-3 flex-1 min-w-0', isUser && 'flex flex-col items-end')}>
        {/* Author tag & timestamp */}
        <div
          className={cn(
            'flex items-center gap-2 text-xs text-slate-400 font-medium',
            isUser && 'flex-row-reverse'
          )}
        >
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {isBot ? 'HealthAssist AI Triage' : 'You (John Doe)'}
          </span>
          <span>•</span>
          <span>{message.timestamp}</span>

          {isBot && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.2 rounded-full">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Consensus Engine</span>
            </span>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            'relative rounded-2xl p-4 sm:p-5 text-sm leading-relaxed max-w-3xl shadow-sm transition-all',
            isBot
              ? 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100'
              : 'bg-emerald-600 text-white shadow-emerald-600/10'
          )}
        >
          {/* Typing indicator */}
          {message.isTyping ? (
            <div className="flex items-center gap-1.5 py-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 ml-2 font-medium">Cross-evaluating clinical models...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.text}</div>
          )}

          {/* Copy Button for Bot Messages */}
          {isBot && !message.isTyping && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-opacity"
              title="Copy message"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Interactive Option Chips */}
        {message.options && message.options.length > 0 && (
          <div className="space-y-1.5 pt-1 w-full">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Suggested Responses / Quick Triage Options:
            </div>
            <div className="flex flex-wrap gap-2">
              {message.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectOption?.(opt)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-800 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all shadow-sm active:scale-95 text-left"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Embedded Result Card if Triage Finished */}
        {message.assessmentResult && (
          <div className="w-full pt-2">
            <ResultCard
              result={message.assessmentResult}
              onBookSpecialist={onBookSpecialist}
            />
          </div>
        )}
      </div>
    </div>
  )
}
