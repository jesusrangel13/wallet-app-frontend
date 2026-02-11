'use client'

import { motion } from 'framer-motion'

interface TimeRangeSelectorProps {
    ranges: string[]
    selected: string
    onChange: (range: string) => void
}

export function TimeRangeSelector({ ranges, selected, onChange }: TimeRangeSelectorProps) {
    return (
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {ranges.map((range) => (
                <button
                    key={range}
                    onClick={() => onChange(range)}
                    className="relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    {selected === range && (
                        <motion.div
                            layoutId="timeRangeIndicator"
                            className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                    )}
                    <span className={`relative z-10 ${selected === range ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'}`}>
                        {range}
                    </span>
                </button>
            ))}
        </div>
    )
}
