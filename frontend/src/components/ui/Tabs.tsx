'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Tab {
    id: string
    label: string
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (id: string) => void
    className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
    return (
        <div className={cn('flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1', className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2',
                        activeTab === tab.id
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    )}
                    style={{
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    {activeTab === tab.id && (
                        <motion.span
                            layoutId="bubble"
                            className="absolute inset-0 z-10 bg-white dark:bg-gray-700 shadow-sm rounded-lg"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-20">{tab.label}</span>
                </button>
            ))}
        </div>
    )
}
