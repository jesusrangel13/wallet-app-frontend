'use client'

import { useState, useId } from 'react'

interface EmojiPickerProps {
  value?: string
  onChange: (emoji: string) => void
  label?: string
  error?: string
}

export const EmojiPicker = ({ value, onChange, label, error }: EmojiPickerProps) => {
  const [inputValue, setInputValue] = useState(value || '')
  const inputId = useId()
  const helperId = useId()
  const errorId = useId()

  const handleChange = (input: string) => {
    setInputValue(input)
    // Extraer primer emoji válido
    const emojiRegex = /\p{Emoji}/u
    const match = input.match(emojiRegex)
    if (match) {
      onChange(match[0])
    }
  }

  // Build aria-describedby
  const describedBy = [
    helperId,
    error ? errorId : null,
  ].filter(Boolean).join(' ')

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="space-y-2">
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Escribe o pega un emoji 😊"
          aria-label={!label ? 'Emoji picker' : undefined}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-3xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={2}
        />
        <p id={helperId} className="text-xs text-gray-500 text-center">
          💡 Usa el teclado de emojis: Windows (Win + .) | Mac (Ctrl + Cmd + Space)
        </p>
      </div>

      {error && (
        <p id={errorId} className="text-red-500 text-sm mt-1" role="alert">{error}</p>
      )}
    </div>
  )
}
