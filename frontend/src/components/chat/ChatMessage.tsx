import React, { useState } from 'react'
import {
  Stethoscope,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  RotateCcw,
  User,
} from 'lucide-react'
import { ChatMessageItem, ChatOption } from '../../types'
import { ResultCard } from '../assessment/ResultCard'
import { cn } from '../../utils/cn'

export interface ChatMessageProps {
  message: ChatMessageItem
  onSelectOption?: (option: ChatOption) => void
  onBookSpecialist?: (specialty?: string) => void
  onRetryMessage?: (message: ChatMessageItem) => void
  userName?: string
  className?: string
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectOption,
  onBookSpecialist,
  onRetryMessage,
  userName = 'You',
  className,
}) => {
  const [copied, setCopied] = useState(false)
  const isBot = message.sender === 'bot'
  const isUser = message.sender === 'user'
  const hasError = message.status === 'error'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format message text with markdown-like bold and bullet point support
  const renderFormattedText = (content: string) => {
    if (!content) return null

    const lines = content.split('\n')
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />
          }

          // Render bold markdown `**text**`
          const parts = line.split(/(\*\*.*?\*\*)/g)
          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return part
          })

          if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-emerald-500 font-bold leading-none mt-1">•</span>
                <span className="flex-1">{renderedLine}</span>
              </div>
            )
          }

          return <p key={idx}>{renderedLine}</p>
        })}
      </div>
    )
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
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/20">
            <Stethoscope className="h-5 w-5" />
          </div>
        ) : (
          <div className="h-9 w-9 rounded-2xl bg-slate-800 dark:bg-slate-700 text-slate-100 flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-slate-400/20">
            {userName.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div className={cn('space-y-2.5 flex-1 min-w-0', isUser && 'flex flex-col items-end')}>
        {/* Author tag & timestamp */}
        <div
          className={cn(
            'flex items-center gap-2 text-xs text-slate-400 font-medium',
            isUser && 'flex-row-reverse'
          )}
        >
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {isBot ? 'HealthAssist Assistant' : userName}
          </span>
          <span>•</span>
          <span>{message.timestamp}</span>

          {isBot && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Multi-LLM Live</span>
            </span>
          )}

          {isUser && message.status === 'sending' && (
            <span className="text-[10px] text-slate-400 animate-pulse">Sending...</span>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            'relative rounded-2xl p-4 sm:p-5 text-sm leading-relaxed max-w-3xl shadow-sm transition-all',
            isBot
              ? 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100'
              : hasError
              ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-600 text-white shadow-emerald-600/10'
          )}
        >
          {/* Typing indicator */}
          {message.isTyping ? (
            <div className="flex items-center gap-2 py-1">
              <div
                className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
              <span className="text-xs text-slate-400 ml-2 font-medium">
                Synthesizing multi-model clinical assessment...
              </span>
            </div>
          ) : (
            renderFormattedText(message.text)
          )}

          {/* Copy Button for Bot Messages */}
          {isBot && !message.isTyping && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-opacity"
              title="Copy message text"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Error and Retry Action for Failed Messages */}
        {hasError && (
          <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 pt-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Message failed to send.</span>
            {onRetryMessage && (
              <button
                type="button"
                onClick={() => onRetryMessage(message)}
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-rose-700 dark:hover:text-rose-300 ml-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Interactive Option Chips */}
        {message.options && message.options.length > 0 && !hasError && (
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
                  className="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-800 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all shadow-xs active:scale-95 text-left"
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
