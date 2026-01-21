'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { cn } from '@/lib/utils'
import { usePayees } from '@/hooks/usePayees'

interface PayeeAutocompleteProps {
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
  placeholder?: string
}

export default function PayeeAutocomplete({
  value = '',
  onChange,
  error,
  label = 'Payee',
  placeholder = "e.g., McDonald's, Uber, Enel",
}: PayeeAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Accessibility IDs
  const inputId = useId()
  const listboxId = useId()
  const errorId = useId()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim().length > 0) {
        setSearchTerm(inputValue.trim())
      } else {
        setSearchTerm(undefined)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue])

  // Sync input value with external value prop
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  const { data: payees = [], isLoading } = usePayees(searchTerm)

  // Filter payees based on input (additional frontend filtering)
  const filteredPayees = payees.filter((payee) =>
    payee.toLowerCase().includes(inputValue.toLowerCase())
  )

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setShowSuggestions(true)
  }

  const handleSelectPayee = (payee: string) => {
    setInputValue(payee)
    onChange(payee)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredPayees.length > 0) {
      e.preventDefault()
      // If there's an exact match, select it
      const exactMatch = filteredPayees.find(
        (payee) => payee.toLowerCase() === inputValue.toLowerCase()
      )
      if (exactMatch) {
        handleSelectPayee(exactMatch)
      } else {
        // Select first suggestion
        handleSelectPayee(filteredPayees[0])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleFocus = () => {
    if (inputValue.trim().length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className="relative w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && filteredPayees.length > 0}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500' : 'border-gray-300'
          )}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="Loading suggestions">
            <svg
              className="animate-spin h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredPayees.length > 0 && (
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          aria-label="Recent payees"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1" aria-hidden="true">
              Recent Payees
            </p>
            {filteredPayees.map((payee, index) => (
              <button
                key={`${payee}-${index}`}
                type="button"
                role="option"
                aria-selected={inputValue.toLowerCase() === payee.toLowerCase()}
                onClick={() => handleSelectPayee(payee)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{payee}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {showSuggestions && inputValue.trim().length > 0 && filteredPayees.length === 0 && !isLoading && (
        <div
          ref={dropdownRef}
          role="status"
          aria-live="polite"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
        >
          <p className="text-sm text-gray-500 italic text-center">
            No previous payees found. Type a new payee name.
          </p>
        </div>
      )}

      {error && <p id={errorId} className="text-red-500 text-sm mt-1" role="alert">{error}</p>}
    </div>
  )
}
