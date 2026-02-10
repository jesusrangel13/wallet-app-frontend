'use client'

import { useState, useRef, useEffect, useId, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, isValid, addDays, subDays } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimePicker } from './TimePicker'
import 'react-day-picker/dist/style.css'

interface DateTimePickerProps {
  value: string | undefined // ISO format
  onChange: (value: string) => void
  label?: string
  error?: string
  includeTime?: boolean
  placeholder?: string
  className?: string
  maxDate?: Date
}

export function DateTimePicker({
  value,
  onChange,
  label,
  error,
  includeTime = false,
  placeholder = 'Select date...',
  className,
  maxDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (value) {
      const parsed = parseISO(value)
      return isValid(parsed) ? parsed : undefined
    }
    return undefined
  })
  const [timeValue, setTimeValue] = useState<string>(() => {
    if (value && includeTime) {
      const parsed = parseISO(value)
      if (isValid(parsed)) {
        return format(parsed, 'HH:mm')
      }
    }
    return '00:00'
  })

  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const dropdownId = useId()
  const labelId = useId()
  const errorId = useId()

  // Handle keyboard escape to close dropdown
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }, [isOpen])

  // Add keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Update internal state when value changes externally
  useEffect(() => {
    if (value) {
      const parsed = parseISO(value)
      if (isValid(parsed)) {
        setSelectedDate(parsed)
        if (includeTime) {
          setTimeValue(format(parsed, 'HH:mm'))
        }
      }
    } else {
      setSelectedDate(undefined)
      setTimeValue('00:00')
    }
  }, [value, includeTime])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)

    if (includeTime) {
      // Combine date with current time
      const [hours, minutes] = timeValue.split(':').map(Number)
      date.setHours(hours, minutes, 0, 0)
    } else {
      // Set time to noon to avoid timezone issues
      date.setHours(12, 0, 0, 0)
    }

    onChange(date.toISOString())
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)

    if (selectedDate) {
      const newDate = new Date(selectedDate)
      const [hours, minutes] = time.split(':').map(Number)
      newDate.setHours(hours, minutes, 0, 0)
      onChange(newDate.toISOString())
    }
  }

  const handleQuickSelect = (days: number) => {
    const date = days === 0 ? new Date() : days > 0 ? addDays(new Date(), days) : subDays(new Date(), Math.abs(days))

    if (includeTime) {
      const [hours, minutes] = timeValue.split(':').map(Number)
      date.setHours(hours, minutes, 0, 0)
    } else {
      date.setHours(12, 0, 0, 0)
    }

    setSelectedDate(date)
    onChange(date.toISOString())
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    setTimeValue('00:00')
    onChange('')
    setIsOpen(false)
  }

  const formatDisplayValue = () => {
    if (!selectedDate) return placeholder

    if (includeTime) {
      return format(selectedDate, 'MMM d, yyyy  HH:mm')
    }
    return format(selectedDate, 'MMM d, yyyy')
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label id={labelId} className="block text-sm font-medium text-foreground mb-1">{label}</label>
      )}

      <div className="relative">
        <div
          ref={buttonRef}
          tabIndex={0}
          role="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={isOpen ? dropdownId : undefined}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left flex items-center justify-between cursor-pointer',
            error ? 'border-red-500' : 'border-input',
            !selectedDate && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            {formatDisplayValue()}
          </span>
          {selectedDate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              aria-label="Clear date"
              className="p-0.5 hover:bg-muted rounded"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" aria-hidden="true" />
            </button>
          )}
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            id={dropdownId}
            role="dialog"
            aria-label="Date picker"
            className="absolute z-50 mt-2 bg-popover border border-border rounded-lg shadow-lg p-3"
          >
            {/* Calendar */}
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="daypicker-custom"
              disabled={maxDate ? { after: maxDate } : undefined}
              modifiersClassNames={{
                selected: 'bg-blue-600 text-white hover:bg-blue-700',
                today: 'font-bold text-blue-600',
              }}
            />

            {/* Time Picker */}
            {includeTime && (
              <>
                <div className="border-t border-border my-2" />
                <TimePicker value={timeValue} onChange={handleTimeChange} />
              </>
            )}

            {/* Quick Select Buttons */}
            <div className="border-t border-border pt-3 mt-3 flex gap-2 justify-center flex-wrap" role="group" aria-label="Quick date selection">
              <button
                type="button"
                onClick={() => handleQuickSelect(0)}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(-1)}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                Yesterday
              </button>
              {(!maxDate || addDays(new Date(), 1) <= maxDate) && (
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1)}
                  className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
                >
                  Tomorrow
                </button>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}
