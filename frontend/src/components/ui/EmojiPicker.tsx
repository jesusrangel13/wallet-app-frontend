'use client'

import { useState } from 'react'

interface EmojiPickerProps {
  value?: string
  onChange: (emoji: string) => void
  label?: string
  error?: string
}

export const EmojiPicker = ({ value, onChange, label, error }: EmojiPickerProps) => {
  const [inputValue, setInputValue] = useState(value || '')

  const handleChange = (input: string) => {
    setInputValue(input)
    // Extraer primer emoji válido
    const emojiRegex = /\p{Emoji}/u
    const match = input.match(emojiRegex)
    if (match) {
      onChange(match[0])
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="space-y-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Escribe o pega un emoji 😊"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-3xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={2}
        />
        <p className="text-xs text-gray-500 text-center">
          💡 Usa el teclado de emojis: Windows (Win + .) | Mac (Ctrl + Cmd + Space)
        </p>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
