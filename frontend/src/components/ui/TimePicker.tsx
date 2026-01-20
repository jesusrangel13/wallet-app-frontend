'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useId, useCallback } from 'react'

interface TimePickerProps {
  value: string // "HH:mm" format
  onChange: (time: string) => void
  className?: string
  /** Accessible label for the time picker */
  label?: string
}

export function TimePicker({ value, onChange, className, label = 'Time' }: TimePickerProps) {
  const [hours, minutes] = value.split(':').map(Number)
  const hoursId = useId()
  const minutesId = useId()

  const incrementHours = useCallback(() => {
    const newHours = (hours + 1) % 24
    onChange(`${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }, [hours, minutes, onChange])

  const decrementHours = useCallback(() => {
    const newHours = hours === 0 ? 23 : hours - 1
    onChange(`${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }, [hours, minutes, onChange])

  const incrementMinutes = useCallback(() => {
    const newMinutes = (minutes + 1) % 60
    onChange(`${String(hours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`)
  }, [hours, minutes, onChange])

  const decrementMinutes = useCallback(() => {
    const newMinutes = minutes === 0 ? 59 : minutes - 1
    onChange(`${String(hours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`)
  }, [hours, minutes, onChange])

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = parseInt(e.target.value) || 0
    if (newHours >= 0 && newHours <= 23) {
      onChange(`${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = parseInt(e.target.value) || 0
    if (newMinutes >= 0 && newMinutes <= 59) {
      onChange(`${String(hours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`)
    }
  }

  // Handle keyboard navigation for spinbutton pattern
  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      incrementHours()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrementHours()
    }
  }

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      incrementMinutes()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      decrementMinutes()
    }
  }

  return (
    <div
      className={cn('flex items-center justify-center gap-2 py-3', className)}
      role="group"
      aria-label={label}
    >
      {/* Hours */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={incrementHours}
          aria-label="Increase hours"
          aria-controls={hoursId}
          tabIndex={-1}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronUp className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>
        <input
          id={hoursId}
          type="text"
          inputMode="numeric"
          role="spinbutton"
          aria-label="Hours"
          aria-valuenow={hours}
          aria-valuemin={0}
          aria-valuemax={23}
          value={String(hours).padStart(2, '0')}
          onChange={handleHoursChange}
          onKeyDown={handleHoursKeyDown}
          className="w-12 text-center text-lg font-medium border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={decrementHours}
          aria-label="Decrease hours"
          aria-controls={hoursId}
          tabIndex={-1}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>
      </div>

      <span className="text-2xl font-bold text-gray-400" aria-hidden="true">:</span>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={incrementMinutes}
          aria-label="Increase minutes"
          aria-controls={minutesId}
          tabIndex={-1}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronUp className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>
        <input
          id={minutesId}
          type="text"
          inputMode="numeric"
          role="spinbutton"
          aria-label="Minutes"
          aria-valuenow={minutes}
          aria-valuemin={0}
          aria-valuemax={59}
          value={String(minutes).padStart(2, '0')}
          onChange={handleMinutesChange}
          onKeyDown={handleMinutesKeyDown}
          className="w-12 text-center text-lg font-medium border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={decrementMinutes}
          aria-label="Decrease minutes"
          aria-controls={minutesId}
          tabIndex={-1}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
