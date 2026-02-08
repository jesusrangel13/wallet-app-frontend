'use client'

import { addMonths, isSameMonth, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRef, useEffect } from 'react'

export type SelectorVariant = 'A' | 'B' | 'C' // Kept for type compatibility if needed, though unused logic

interface MonthSelectorVariantsProps {
    currentDate: Date
    onDateChange: (date: Date) => void
    variant?: SelectorVariant // Optional now, defaults to Timeline
    summaryData?: any // Unused in this clean version
}

export function MonthSelectorVariants({
    currentDate,
    onDateChange,
}: MonthSelectorVariantsProps) {

    // Create a range of months (e.g. 6 months back, 6 months forward)
    const months = []
    for (let i = -6; i <= 6; i++) {
        months.push(addMonths(currentDate, i))
    }

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to center on mount/update is tricky with exact pixels, 
    // but we can try to keep the active item in view.
    // For simplicity in this refined version, we trust the flex center alignment 
    // or add a simple effect if needed. 
    // Actually, standard scroll-snap or just manual scroll is fine for "Timeline".

    return (
        <div className="relative group w-full mb-2">
            {/* 
          Refined Design:
          - No heavy background container
          - Subtle gradient masks for scroll overflow
          - Clean typography
       */}

            {/* Background Track (Optional, very subtle) */}
            <div className="absolute inset-x-0 bottom-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />

            <div
                ref={scrollContainerRef}
                className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 relative"
            >
                {/* Navigation Buttons (Absolute for cleaner look, or sticky) */}
                <button
                    onClick={() => onDateChange(addMonths(currentDate, -1))}
                    className="absolute left-0 z-20 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gradient-to-r from-background via-background to-transparent"
                    aria-label="Previous Month"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex-1 flex justify-center items-center gap-1 sm:gap-3 px-8 min-w-full">
                    {months.map((date, idx) => {
                        const isSelected = isSameMonth(date, currentDate)
                        const isFuture = date > new Date()

                        // Calculate opacity/scale based on distance from center (simplified logic)
                        // We just use isSelected for the main pop.

                        return (
                            <button
                                key={idx}
                                onClick={() => onDateChange(date)}
                                disabled={isFuture}
                                className={cn(
                                    "relative flex flex-col items-center justify-center min-w-[60px] sm:min-w-[80px] py-2 rounded-xl transition-all duration-300",
                                    isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
                                    isSelected ? "scale-100 z-10" : "scale-90 opacity-60 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                )}
                            >
                                <span className={cn(
                                    "text-xs uppercase tracking-widest mb-1 transition-colors",
                                    isSelected ? "text-primary font-bold" : "text-gray-500"
                                )}>
                                    {format(date, 'MMM', { locale: es })}
                                </span>
                                <span className={cn(
                                    "text-sm sm:text-base leading-none transition-colors",
                                    isSelected ? "text-gray-900 dark:text-white font-bold" : "text-gray-500 font-medium"
                                )}>
                                    {format(date, 'yyyy')}
                                </span>

                                {/* Active Indicator: Elegant pill instead of dot */}
                                {isSelected && (
                                    <motion.div
                                        layoutId="activeMonth"
                                        className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.6)]"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                <button
                    onClick={() => onDateChange(addMonths(currentDate, 1))}
                    className="absolute right-0 z-20 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gradient-to-l from-background via-background to-transparent"
                    aria-label="Next Month"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

// Needed for motion prop
import { motion } from 'framer-motion'
