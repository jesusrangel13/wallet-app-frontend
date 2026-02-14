'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Eye, EyeOff, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'
import { useState } from 'react'
import { AnimatedCurrency } from '@/components/ui/animations/AnimatedCurrency'
import { ClairCard } from '@/components/ui/ClairCard'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface HeroBalanceWidgetProps {
    totalBalance: number
    currency: 'CLP' | 'USD' | 'EUR'
    changePercent: number
    changeAmount: number
    period: string // "vs. mes anterior"
    monthlyIncome?: number
    monthlyExpenses?: number
    monthlySavings?: number
    personalExpenses?: number
    sharedExpenses?: number
}

// Generate some dummy data for the sparkline if not provided
const generateSparklineData = () => {
    return Array.from({ length: 15 }).map((_, i) => ({
        value: 50 + Math.random() * 50 + (i * 2) // Slight upward trend
    }))
}

export function HeroBalanceWidget({
    totalBalance,
    currency,
    changePercent,
    changeAmount,
    period,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    monthlySavings = 0,
    personalExpenses = 0,
    sharedExpenses = 0
}: HeroBalanceWidgetProps) {
    const [isHidden, setIsHidden] = useState(false)
    const [isBreakdownView, setIsBreakdownView] = useState(false)
    const [data] = useState(generateSparklineData())

    const isPositive = changePercent > 0
    const isNegative = changePercent < 0

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
    const trendColor = isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-gray-500'
    const trendBg = isPositive ? 'bg-emerald-500/10' : isNegative ? 'bg-rose-500/10' : 'bg-gray-500/10'
    const sparklineColor = isPositive ? '#10b981' : isNegative ? '#f43f5e' : '#6b7280' // emerald-500 vs rose-500

    return (
        <ClairCard className="h-full flex flex-col group">
            {/* Background decorations for "Flow" feel - Handled by ClairCard now, 
                but we can supercharge them if needed. 
                ClairCard has default glow, let's stick to standard for consistency.
             */}


            {/* Main Content Area */}
            <div className="p-6 md:p-8 flex-1 relative z-10">
                {/* Background Wave Chart */}
                <div className="absolute inset-0 opacity-40 dark:opacity-30 pointer-events-none translate-y-4 md:translate-y-8 mix-blend-multiply dark:mix-blend-screen">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorSparkHero" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} /> {/* Violet */}
                                    <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.8} /> {/* Cyan */}
                                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.8} /> {/* Cyan Light */}
                                </linearGradient>
                                <linearGradient id="fillSparkHero" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="url(#colorSparkHero)"
                                strokeWidth={4}
                                fill="url(#fillSparkHero)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <span className="text-metric-label">
                        Patrimonio Total
                    </span>
                    <button
                        onClick={() => setIsHidden(!isHidden)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
                        aria-label={isHidden ? 'Mostrar balance' : 'Ocultar balance'}
                    >
                        {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>

                {/* Big Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 relative z-10"
                >
                    {isHidden ? (
                        <div className="text-balance-hero text-gray-900 dark:text-white">
                            ••••••
                        </div>
                    ) : (
                        <div className="text-balance-hero text-gray-900 dark:text-white">
                            <AnimatedCurrency
                                amount={totalBalance}
                                currency={currency}
                                duration={1.2}
                            />
                        </div>
                    )}
                </motion.div>

                {/* Trend Badge */}
                <div className="relative z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                    <span className={`text-sm font-bold font-numeric ${trendColor}`}>
                        {Math.abs(changePercent).toFixed(1)}%
                    </span>
                    {!isHidden && (
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                            {isPositive ? '+' : '-'}<AnimatedCurrency amount={Math.abs(changeAmount)} currency={currency} /> {period}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer Summary - Command Center Carousel */}
            <div className="border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-black/20 backdrop-blur-md relative min-h-[100px] z-20">
                {/* Carousel Content */}
                <div
                    className={`grid h-full cursor-pointer transition-colors hover:bg-white/20 dark:hover:bg-white/5 relative z-10 ${!isBreakdownView
                        ? 'grid-cols-2 md:grid-cols-4' // Primary: 2x2 on mobile, 4 cols on desktop
                        : 'grid-cols-3' // Secondary: 3 cols always
                        }`}
                    onClick={() => setIsBreakdownView(!isBreakdownView)}
                >
                    {/* View 1: Standard (Income | Total Exp | My Exp | Savings) */}
                    {!isBreakdownView && (
                        <>
                            {/* Income */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className="p-4 md:px-6 md:py-5 border-r border-gray-100 dark:border-gray-800 border-b md:border-b-0 flex flex-col gap-1 items-start"
                            >
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-0.5">
                                    <ArrowUpCircle className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Ingresos</span>
                                </div>
                                {isHidden ? (
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">•••</span>
                                ) : (
                                    <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        <AnimatedCurrency amount={monthlyIncome} currency={currency} />
                                    </span>
                                )}
                            </motion.div>

                            {/* Total Expenses */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="p-4 md:px-6 md:py-5 border-r md:border-r border-gray-100 dark:border-gray-800 border-b md:border-b-0 flex flex-col gap-1 items-start"
                            >
                                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-0.5">
                                    <ArrowDownCircle className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Gastos Tot.</span>
                                </div>
                                {isHidden ? (
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">•••</span>
                                ) : (
                                    <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        <AnimatedCurrency amount={monthlyExpenses} currency={currency} />
                                    </span>
                                )}
                            </motion.div>

                            {/* My Monthly Expenses - NEW */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                className="p-4 md:px-6 md:py-5 border-r border-gray-100 dark:border-gray-800 flex flex-col gap-1 items-start relative group"
                            >
                                <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 mb-0.5">
                                    <ArrowDownCircle className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Mis Gastos</span>
                                </div>
                                {isHidden ? (
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">•••</span>
                                ) : (
                                    <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform">
                                        <AnimatedCurrency amount={personalExpenses + sharedExpenses} currency={currency} />
                                    </span>
                                )}
                                {/* Hint badge */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">Ver detalle</span>
                                </div>
                            </motion.div>

                            {/* Savings */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="p-4 md:px-6 md:py-5 flex flex-col gap-1 items-start"
                            >
                                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-0.5">
                                    <Wallet className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Ahorro</span>
                                </div>
                                {isHidden ? (
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">•••</span>
                                ) : (
                                    <span className={`text-lg md:text-xl font-bold ${monthlySavings >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-500'}`}>
                                        <AnimatedCurrency amount={monthlySavings} currency={currency} />
                                    </span>
                                )}
                            </motion.div>
                        </>
                    )}

                    {/* View 2: Breakdown (Personal | Shared | Total) */}
                    {isBreakdownView && (
                        <>
                            {/* Personal */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className="p-4 md:px-6 md:py-5 border-r border-gray-100 dark:border-gray-800 flex flex-col gap-1 items-start"
                            >
                                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-0.5">
                                    <span className="text-xs font-bold uppercase tracking-wide">Personales</span>
                                </div>
                                {isHidden ? (
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">•••</span>
                                ) : (
                                    <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        <AnimatedCurrency amount={personalExpenses || 0} currency={currency} />
                                    </span>
                                )}
                            </motion.div>

                            {/* Shared */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="p-4 md:px-6 md:py-5 border-r border-gray-100 dark:border-gray-800 flex flex-col gap-1 items-start"
                            >
                                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-0.5">
                                    <span className="text-xs font-bold uppercase tracking-wide">Compartidos</span>
                                </div>
                                {isHidden ? (
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">•••</span>
                                ) : (
                                    <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                        <AnimatedCurrency amount={sharedExpenses || 0} currency={currency} />
                                    </span>
                                )}
                            </motion.div>

                            {/* Back/Total Context */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="p-4 md:px-6 md:py-5 flex flex-col gap-1 items-start group content-center justify-center items-center"
                            >
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
                                    <span className="text-xs font-bold uppercase tracking-wide">Volver al Resumen</span>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Carousel Indicators - Hide on Desktop if 4 columns show everything */}
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1.5 pointer-events-none md:hidden">
                    <div className={`w-1 h-1 rounded-full transition-colors ${!isBreakdownView ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    <div className={`w-1 h-1 rounded-full transition-colors ${isBreakdownView ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                </div>
            </div>

        </ClairCard>
    )
}
