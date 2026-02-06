'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { AnimatedCurrency } from '@/components/ui/animations/AnimatedCurrency'
import { Card } from '@/components/ui/Card'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'

interface HeroBalanceWidgetProps {
    totalBalance: number
    currency: 'CLP' | 'USD' | 'EUR'
    changePercent: number
    changeAmount: number
    period: string // "vs. mes anterior"
}

// Generate some dummy data for the sparkline if not provided
// In a real scenario, this would come from props
const generateSparklineData = () => {
    return Array.from({ length: 7 }).map((_, i) => ({
        value: Math.random() * 100 + 50
    }))
}

export function HeroBalanceWidget({
    totalBalance,
    currency,
    changePercent,
    changeAmount,
    period
}: HeroBalanceWidgetProps) {
    const [isHidden, setIsHidden] = useState(false)
    const [data] = useState(generateSparklineData())

    const isPositive = changePercent > 0
    const isNegative = changePercent < 0

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
    const trendColor = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500'
    const trendBg = isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50'
    const sparklineColor = isPositive ? '#22c55e' : isNegative ? '#ef4444' : '#6b7280'

    return (
        <Card variant="gradient" className="p-6 md:p-8 relative overflow-hidden dark:from-gray-900 dark:to-gray-800 border-none shadow-xl">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
                <TrendingUp className="w-32 h-32 dark:text-white" />
            </div>

            {/* Header con toggle de visibilidad */}
            <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Balance Total
                </span>
                <button
                    onClick={() => setIsHidden(!isHidden)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    aria-label={isHidden ? 'Mostrar balance' : 'Ocultar balance'}
                >
                    {isHidden ? (
                        <EyeOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                        <Eye className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                </button>
            </div>

            {/* Balance Principal */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 relative z-10"
            >
                {isHidden ? (
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight font-numeric">
                        ••••••
                    </div>
                ) : (
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight font-numeric">
                        <AnimatedCurrency
                            amount={totalBalance}
                            currency={currency}
                            duration={1.5}
                        />
                    </div>
                )}
            </motion.div>

            <div className="flex items-end justify-between relative z-10">
                {/* Cambio vs período anterior */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-1"
                >
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${trendBg} dark:bg-opacity-20`}>
                            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                            <span className={`text-sm font-semibold ${trendColor}`}>
                                {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
                            </span>
                        </div>
                        {!isHidden && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                {isPositive ? '+' : ''}<AnimatedCurrency amount={changeAmount} currency={currency} /> {period}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Mini Sparkline */}
                <div className="w-24 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorSpark" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={sparklineColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={sparklineColor}
                                fillOpacity={1}
                                fill="url(#colorSpark)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    )
}
