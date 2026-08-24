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
  onRetryMessage?: (message: ChatMessageItem) => void
  userName?: string
  className?: string
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectOption,
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
            if (part.startsWith('_') && part.endsWith('_')) {
              return (
                <em key={pIdx} className="italic text-slate-500 dark:text-slate-400">
                  {part.slice(1, -1)}
                </em>
              )
            }
            return part
          })

          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-emerald-500 font-bold">•</span>
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
        'flex gap-2.5 max-w-3xl transition-colors group',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto',
        className
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          'h-7 w-7 rounded-md flex items-center justify-center shrink-0 border select-none',
          isBot
            ? 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]'
            : 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]'
        )}
      >
        {isBot ? <Stethoscope className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>

      {/* Message Content Container */}
      <div className={cn('space-y-1.5 flex-1 min-w-0', isUser ? 'items-end flex flex-col' : '')}>
        {/* Header with Name and Timestamp */}
        <div
          className={cn(
            'flex items-center gap-2 text-[11px] text-[#6B7280]',
            isUser ? 'flex-row-reverse' : ''
          )}
        >
          <span className="font-medium text-[#374151]">
            {isBot ? 'TRISHUL AI' : userName}
          </span>
          <span>•</span>
          <span>{message.timestamp}</span>
        </div>

        {/* Text Bubble Card */}
        {message.text && (
          <div
            className={cn(
              'p-3.5 rounded-lg text-[13px] border leading-relaxed relative',
              isBot
                ? 'bg-white border-[#E5E7EB] text-[#111827] shadow-subtle'
                : 'bg-[#EFF6FF] border-[#DBEAFE] text-[#111827]',
              hasError && 'border-[#FECACA] bg-red-50 text-[#DC2626]'
            )}
          >
            {renderFormattedText(message.text)}

            {/* Quick Action Tools on Hover */}
            {isBot && (
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]"
                  title="Copy text"
                >
                  {copied ? <Check className="h-3 w-3 text-[#16A34A]" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Typing Loader */}
        {message.isTyping && (
          <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] shadow-subtle flex items-center gap-2 text-xs text-[#6B7280]">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse" />
              <div
                className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <div
                className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
            <span className="text-[12px] text-[#4B5563]">
              Evaluating clinical consensus across 3 models...
            </span>
          </div>
        )}

        {/* Error and Retry Action */}
        {hasError && (
          <div className="flex items-center gap-2 text-xs text-[#DC2626] pt-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Message failed to send.</span>
            {onRetryMessage && (
              <button
                type="button"
                onClick={() => onRetryMessage(message)}
                className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-[#B91C1C] ml-1"
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
            <div className="text-[11px] font-medium text-[#6B7280]">
              Suggested responses:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectOption?.(opt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#374151] hover:text-[#111827] transition-colors shadow-subtle text-left"
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
            <ResultCard result={message.assessmentResult} />
          </div>
        )}
      </div>
    </div>
  )
}
