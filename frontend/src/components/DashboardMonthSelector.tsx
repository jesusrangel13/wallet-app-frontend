'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

interface DashboardMonthSelectorProps {
    currentDate: Date
    onDateChange: (date: Date) => void
}

export function DashboardMonthSelector({
    currentDate,
    onDateChange
}: DashboardMonthSelectorProps) {
    const locale = useLocale()
    const dateLocale = locale === 'es' ? es : enUS

    // Handlers
    const prevMonth = () => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() - 1)
        onDateChange(newDate)
    }

    const nextMonth = () => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + 1)
        onDateChange(newDate)
    }

    const isFuture = (date: Date) => {
        const now = new Date()
        return date > now && date.getMonth() !== now.getMonth()
    }

    return (
        <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity" />
            <div className="relative flex items-center justify-between gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg rounded-2xl p-1.5 w-full sm:w-auto">
                <button
                    onClick={prevMonth}
                    className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors shrink-0"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center px-2 sm:px-4 min-w-[100px] sm:min-w-[120px] flex-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        {format(currentDate, 'yyyy')}
                    </span>
                    <span className="text-base font-bold text-gray-900 dark:text-white capitalize leading-none text-center">
                        {format(currentDate, 'MMMM', { locale: dateLocale })}
                    </span>
                </div>

                <button
                    onClick={nextMonth}
                    disabled={isFuture(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className={cn(
                        "p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors shrink-0",
                        isFuture(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)) && "opacity-30 cursor-not-allowed"
                    )}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
