'use client'

import { Check } from 'lucide-react'

interface TimelineConnectorProps {
    isFirst?: boolean
    isLast?: boolean
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
    isSelected?: boolean
    onToggle?: () => void
}

const dotColors = {
    EXPENSE: 'bg-red-400',
    INCOME: 'bg-green-400',
    TRANSFER: 'bg-blue-400',
}

const ringColors = {
    EXPENSE: 'ring-red-400',
    INCOME: 'ring-green-400',
    TRANSFER: 'ring-blue-400',
}

const neonShadows = {
    EXPENSE: 'shadow-[0_0_10px_rgba(248,113,113,0.7)]',
    INCOME: 'shadow-[0_0_10px_rgba(74,222,128,0.7)]',
    TRANSFER: 'shadow-[0_0_10px_rgba(96,165,250,0.7)]',
}

// Line Styles (Glass - Continuous solid line)
export function TimelineConnector({ isFirst, isLast, type, isSelected, onToggle }: TimelineConnectorProps) {
    const getLineStyles = () => {
        const transparent = "bg-transparent"
        return {
            top: !isFirst ? "w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" : transparent,
            bottom: !isLast ? "w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" : transparent
        }
    }

    // Dot Styles (Glass + Morphing)
    const getDotStyles = () => {
        const base = "rounded-full z-10 transition-all duration-300 flex items-center justify-center p-0.5"

        return `${base} ${isSelected
            ? 'w-5 h-5 bg-primary text-primary-foreground scale-110 ring-0'
            : 'w-3 h-3 ' + dotColors[type] + ' ring-0 ' + neonShadows[type] + ' ring-2 ring-white dark:ring-gray-950 hover:scale-125 cursor-pointer'
            }`
    }

    const lineStyles = getLineStyles()

    return (
        <div className="flex flex-col items-center w-6 mr-2 self-stretch relative">
            {/* Upper Line */}
            <div className={lineStyles.top} />

            {/* Dot / Checkbox */}
            <div
                className={getDotStyles()}
                onClick={(e) => {
                    e.stopPropagation()
                    onToggle?.()
                }}
            >
                {isSelected && (
                    <Check className="w-3 h-3" strokeWidth={3} />
                )}
            </div>

            {/* Lower Line */}
            <div className={lineStyles.bottom} />

            {/* Bridge Line for Continuous Look */}
            {!isLast && (
                <div className="absolute -bottom-2 left-1/2 w-0.5 h-4 -translate-x-1/2 bg-gray-200 dark:bg-gray-700 z-0" />
            )}
        </div >
    )
}
