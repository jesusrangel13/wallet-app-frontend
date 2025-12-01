'use client'

import React from 'react'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const MonthSelector = () => {
  const {
    month,
    year,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    resetToCurrentMonth,
    setMonthYear,
  } = useSelectedMonth()

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Check if next button should be disabled (can't go beyond current month)
  const isNextDisabled =
    year === currentYear && month === currentMonth

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value)
    setMonthYear(newMonth, year)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value)
    setMonthYear(month, newYear)
  }

  // Generate year options (current year and 5 years back)
  const yearOptions = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    yearOptions.push(i)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Previous Month Button */}
      <button
        onClick={goToPreviousMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Mes anterior"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>

      {/* Month/Year Selectors */}
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={handleMonthChange}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          {MONTH_NAMES.map((monthName, idx) => {
            // Disable future months
            const isDisabled =
              year === currentYear && idx > currentMonth
            return (
              <option key={idx} value={idx} disabled={isDisabled}>
                {monthName}
              </option>
            )
          })}
        </select>

        <select
          value={year}
          onChange={handleYearChange}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          {yearOptions.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </div>

      {/* Next Month Button */}
      <button
        onClick={goToNextMonth}
        disabled={isNextDisabled}
        className={`p-2 rounded-lg transition-colors ${
          isNextDisabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-gray-100'
        }`}
        title="Mes siguiente"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>

      {/* Today Button - Only show when not viewing current month */}
      {!isCurrentMonth && (
        <button
          onClick={resetToCurrentMonth}
          className="ml-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
          title="Ir al mes actual"
        >
          <Calendar className="w-4 h-4" />
          Hoy
        </button>
      )}
    </div>
  )
}
