'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string // "HH:mm" format
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hours, minutes] = value.split(':').map(Number)

  const incrementHours = () => {
    const newHours = (hours + 1) % 24
    onChange(`${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const decrementHours = () => {
    const newHours = hours === 0 ? 23 : hours - 1
    onChange(`${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const incrementMinutes = () => {
    const newMinutes = (minutes + 1) % 60
    onChange(`${String(hours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`)
  }

  const decrementMinutes = () => {
    const newMinutes = minutes === 0 ? 59 : minutes - 1
    onChange(`${String(hours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`)
  }

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

  return (
    <div className={cn('flex items-center justify-center gap-2 py-3', className)}>
      {/* Hours */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={incrementHours}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronUp className="w-4 h-4 text-gray-600" />
        </button>
        <input
          type="text"
          value={String(hours).padStart(2, '0')}
          onChange={handleHoursChange}
          className="w-12 text-center text-lg font-medium border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={decrementHours}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <span className="text-2xl font-bold text-gray-400">:</span>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={incrementMinutes}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronUp className="w-4 h-4 text-gray-600" />
        </button>
        <input
          type="text"
          value={String(minutes).padStart(2, '0')}
          onChange={handleMinutesChange}
          className="w-12 text-center text-lg font-medium border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={decrementMinutes}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
