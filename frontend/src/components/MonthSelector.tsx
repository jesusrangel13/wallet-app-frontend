'use client'

import React, { useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

export const MonthSelector = () => {
  const locale = useLocale()
  const t = useTranslations('common')
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

  // Function to get localized month name using Intl.DateTimeFormat
  const getMonthName = useCallback((monthIndex: number) => {
    const date = new Date(year, monthIndex, 1)
    return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date)
  }, [year, locale])

  // Check if next button should be disabled (can't go beyond current month)
  const isNextDisabled =
    year === currentYear && month === currentMonth

  // Memoize event handlers to prevent child re-renders
  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value)
    setMonthYear(newMonth, year)
  }, [setMonthYear, year])

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value)
    setMonthYear(month, newYear)
  }, [setMonthYear, month])

  // Memoize year options generation
  const yearOptions = useMemo(() => {
    const options = []
    for (let i = currentYear; i >= currentYear - 5; i--) {
      options.push(i)
    }
    return options
  }, [currentYear])

  return (
    <div className="flex items-center gap-2">
      {/* Previous Month Button */}
      <button
        onClick={goToPreviousMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title={t('date.navigation.previousMonth')}
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
          {Array.from({ length: 12 }, (_, idx) => {
            // Disable future months
            const isDisabled =
              year === currentYear && idx > currentMonth
            return (
              <option key={idx} value={idx} disabled={isDisabled}>
                {getMonthName(idx)}
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
        className={`p-2 rounded-lg transition-colors ${isNextDisabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-gray-100'
          }`}
        title={t('date.navigation.nextMonth')}
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>

      {/* Today Button - Only show when not viewing current month */}
      {!isCurrentMonth && (
        <button
          onClick={resetToCurrentMonth}
          className="ml-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
          title={t('date.navigation.currentMonth')}
        >
          <Calendar className="w-4 h-4" />
          {t('date.navigation.currentMonth')}
        </button>
      )}
    </div>
  )
}
