import React, { useState, useRef, useEffect } from 'react'
import { ArrowUp, Paperclip, Mic, Sparkles, ShieldCheck } from 'lucide-react'
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

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-2.5', className)}>
      {/* Quick Suggestion Pills */}
      {quickSuggestions && quickSuggestions.length > 0 && !disabled && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <div className="flex items-center gap-1 text-slate-400 shrink-0 font-medium text-[11px]">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            <span>Try:</span>
          </div>
          {quickSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(suggestion)}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200/80 dark:border-slate-700/80 text-[11px] whitespace-nowrap transition-all shrink-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Modern ChatGPT-style Chat Box */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all p-2.5">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none max-h-36 overflow-y-auto"
        />

        <div className="flex items-center justify-between pt-1 px-1">
          {/* Left tools: Attach & Voice */}
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Attach lab report or image (Demo)"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Dictate symptoms via microphone (Demo)"
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
              'h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150',
              input.trim() && !disabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            )}
            aria-label="Send symptom message"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Medical Safety Disclaimer Footnote */}
      <div className="text-center">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
          HealthAssist AI provides clinical triage support. In case of acute medical emergencies, call 911.
        </p>
      </div>
    </div>
  )
}
