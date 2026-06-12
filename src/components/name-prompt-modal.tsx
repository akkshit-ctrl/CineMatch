'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface NamePromptModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export default function NamePromptModal({ open, onClose, onSubmit }: NamePromptModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a name')
      return
    }
    setError('')
    onSubmit(trimmed)
    setName('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-surface max-w-sm mx-4 w-full rounded-xl border border-accent-gold/20 shadow-2xl shadow-accent-gold/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">What should we call you?</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          This is how other players will see you.
        </p>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            maxLength={24}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            placeholder="Enter your name"
            className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-foreground text-center placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-gold/40 transition-shadow"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {name.length}/24
          </span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full bg-accent-gold text-black font-semibold rounded-lg py-2.5 hover:brightness-110 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
