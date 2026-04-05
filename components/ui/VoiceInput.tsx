'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onTranscript: (text: string) => void
  className?: string
}

export function VoiceButton({ onTranscript, className }: Props) {
  const [listening, setListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('La dictée vocale n\'est pas supportée par ce navigateur.')
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={listening ? 'Arrêter la dictée' : 'Dictée vocale'}
      className={cn(
        'p-2 rounded-lg transition-all',
        listening
          ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
        className,
      )}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}

// Wrapper for textarea with voice
interface VoiceTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  label?: string
  required?: boolean
}

export function VoiceTextarea({
  value, onChange, placeholder, rows = 3, className, label, required,
}: VoiceTextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={cn('input pr-10 resize-none', className)}
        />
        <div className="absolute right-2 bottom-2">
          <VoiceButton
            onTranscript={(t) => onChange(value ? `${value} ${t}` : t)}
          />
        </div>
      </div>
    </div>
  )
}
