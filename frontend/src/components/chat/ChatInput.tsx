import React, { useState, useRef, useEffect } from 'react'
import { ArrowUp, Paperclip, Mic, Sparkles, ShieldAlert } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
  quickSuggestions?: string[]
  className?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Describe your symptoms in detail (e.g., headache for 2 days, mild fever)...',
  quickSuggestions = [
    'Persistent dry cough for 3 days',
    'Sharp lower right back soreness',
    'Mild skin rash on forearm',
    'Sinus pressure and fatigue',
  ],
  className,
}) => {
  const [input, setInput] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
    }
  }, [input])

  const handleSend = () => {
    if (!input.trim() || disabled) return
    onSendMessage(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleVoiceDemo = () => {
    if (voiceActive) {
      setVoiceActive(false)
      return
    }
    setVoiceActive(true)
    setInput('I have a severe headache with sinus pressure for 2 days...')
    setTimeout(() => {
      setVoiceActive(false)
    }, 2000)
  }

  return (
    <div className={cn('w-full max-w-3xl mx-auto space-y-2', className)}>
      {/* Quick Suggestion Pills */}
      {quickSuggestions && quickSuggestions.length > 0 && !disabled && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[#9CA3AF] text-[11px] shrink-0 font-medium mr-1">
            Try:
          </span>
          {quickSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(suggestion)}
              className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#111827] text-[11px] whitespace-nowrap transition-colors shrink-0 shadow-subtle"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Clean Technical Input Box */}
      <div className="relative rounded-lg border border-[#E5E7EB] bg-white shadow-subtle focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition-colors p-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none max-h-32 overflow-y-auto leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1 px-1">
          {/* Left tools: Attach & Voice */}
          <div className="flex items-center gap-1 text-[#6B7280]">
            <button
              type="button"
              onClick={() => {
                alert('Attachment upload: You can attach past lab PDFs or image scans in clinical review.')
              }}
              className="p-1.5 rounded-md hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
              title="Attach lab report or image (Demo)"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleVoiceDemo}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                voiceActive
                  ? 'bg-red-50 text-[#DC2626] animate-pulse'
                  : 'hover:bg-[#F3F4F6] hover:text-[#111827]'
              )}
              title={voiceActive ? 'Listening...' : 'Dictate symptoms via microphone (Demo)'}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
              input.trim() && !disabled
                ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer'
                : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
            )}
            aria-label="Send symptom message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Footnote */}
      <div className="text-center pt-0.5">
        <p className="text-[11px] text-[#6B7280]">
          This tool provides AI-assisted health awareness and does not constitute a definitive medical diagnosis.
        </p>
      </div>
    </div>
  )
}
