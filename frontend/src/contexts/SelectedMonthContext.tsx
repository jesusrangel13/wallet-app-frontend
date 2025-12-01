'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface SelectedMonthContextType {
  month: number
  year: number
  isCurrentMonth: boolean
  setMonth: (month: number) => void
  setYear: (year: number) => void
  setMonthYear: (month: number, year: number) => void
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  resetToCurrentMonth: () => void
}

const SelectedMonthContext = createContext<SelectedMonthContextType | undefined>(undefined)

export const SelectedMonthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const now = new Date()
  const [month, setMonthState] = useState<number>(now.getMonth())
  const [year, setYearState] = useState<number>(now.getFullYear())

  // Check if the selected month is the current month
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear()

  const setMonth = useCallback((newMonth: number) => {
    setMonthState(newMonth)
  }, [])

  const setYear = useCallback((newYear: number) => {
    setYearState(newYear)
  }, [])

  const setMonthYear = useCallback((newMonth: number, newYear: number) => {
    setMonthState(newMonth)
    setYearState(newYear)
  }, [])

  const goToPreviousMonth = useCallback(() => {
    if (month === 0) {
      setMonthState(11)
      setYearState((prev) => prev - 1)
    } else {
      setMonthState((prev) => prev - 1)
    }
  }, [month])

  const goToNextMonth = useCallback(() => {
    const now = new Date()
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year

    // Don't allow selecting future months
    const nextDate = new Date(nextYear, nextMonth)
    const currentDate = new Date(now.getFullYear(), now.getMonth())

    if (nextDate <= currentDate) {
      if (month === 11) {
        setMonthState(0)
        setYearState((prev) => prev + 1)
      } else {
        setMonthState((prev) => prev + 1)
      }
    }
  }, [month, year])

  const resetToCurrentMonth = useCallback(() => {
    const now = new Date()
    setMonthState(now.getMonth())
    setYearState(now.getFullYear())
  }, [])

  const value: SelectedMonthContextType = {
    month,
    year,
    isCurrentMonth,
    setMonth,
    setYear,
    setMonthYear,
    goToPreviousMonth,
    goToNextMonth,
    resetToCurrentMonth,
  }

  return <SelectedMonthContext.Provider value={value}>{children}</SelectedMonthContext.Provider>
}

export const useSelectedMonth = () => {
  const context = useContext(SelectedMonthContext)
  if (context === undefined) {
    throw new Error('useSelectedMonth must be used within a SelectedMonthProvider')
  }
  return context
}
