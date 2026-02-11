'use client'

import { motion } from 'framer-motion'

interface CustomTooltipProps {
    active?: boolean
    payload?: any[]
    label?: string
    currency?: 'CLP' | 'USD' | 'EUR'
    previousValue?: number
    formatter?: (value: number) => string
}

export function CustomTooltip({
    active,
    payload,
    label,
    currency = 'CLP',
    previousValue,
    formatter
}: CustomTooltipProps) {
    if (!active || !payload || !payload.length) return null

    // Support for multiple data points (comparison view)
    const currentData = payload[0]
    const value = currentData?.value
    const name = currentData?.name || 'Valor'

    // Try to find comparison data if available
    const comparisonData = payload.find((p: any) => p.dataKey === 'previousValue' || p.name === 'Anterior')
    const prevValue = comparisonData ? comparisonData.value : previousValue

    const percentChange = prevValue
        ? ((value / prevValue) * 100 - 100)
        : 0

    const formatValue = (val: number) => {
        if (formatter) return formatter(val)
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'CLP' ? 0 : 2,
        }).format(val)
    }

    // Determine date format based on label length/content if needed, 
    // but for now relying on the passed label which comes from XAxis
    const formattedDate = label

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
        >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{formattedDate}</p>

            <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatValue(value)}
                </p>
                {(prevValue !== undefined && prevValue !== null) && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${percentChange >= 0
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
                    </span>
                )}
            </div>

            {payload.length > 1 && (
                <div className="mt-2 space-y-1 border-t border-gray-100 dark:border-gray-700 pt-2">
                    {payload.slice(1).map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs items-center gap-4">
                            <span style={{ color: entry.color }} className="font-medium">
                                {entry.name}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                                {formatValue(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}
