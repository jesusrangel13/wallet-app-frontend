'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { formatCurrency, Currency } from '@/types/currency'
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedCounter } from './ui/animations'

interface LoansSummaryProps {
    stats: {
        totalLent: number
        totalPending: number
        totalRecovered: number
        activeCount: number
    }
    currency?: Currency
}

export function LoansSummary({ stats, currency = 'USD' }: LoansSummaryProps) {
    // Animation variants for staggered entrance
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
            {/* Total Lent (Portfolio Size) */}
            <motion.div variants={item}>
                <ClairCard className="h-full">
                    <div className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                                    <Wallet className="w-4 h-4" />
                                    Total Prestado
                                </p>
                                <div className="text-balance-large text-slate-800 dark:text-slate-100">
                                    {formatCurrency(stats.totalLent, currency)}
                                </div>
                            </div>
                            <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-full backdrop-blur-sm">
                                <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-blue-600/80 dark:text-blue-400/80">
                            Cartera histórica total
                        </div>
                    </div>
                </ClairCard>
            </motion.div>

            {/* Pending (At Risk/Receivable) - Highlighted */}
            <motion.div variants={item}>
                <ClairCard className="h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                    <div className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Por Cobrar
                                </p>
                                <div className="text-balance-large text-orange-700 dark:text-orange-300">
                                    {formatCurrency(stats.totalPending, currency)}
                                </div>
                            </div>
                            <div className="p-2 bg-orange-100/50 dark:bg-orange-900/30 rounded-full backdrop-blur-sm">
                                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs font-medium bg-orange-100/80 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                {stats.activeCount} activos
                            </span>
                            <span className="text-xs text-orange-600/80 dark:text-orange-400/80">
                                Pendientes de pago
                            </span>
                        </div>
                    </div>
                </ClairCard>
            </motion.div>

            {/* Recovered (Success) */}
            <motion.div variants={item}>
                <ClairCard className="h-full">
                    <div className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                                    <ArrowDownLeft className="w-4 h-4" />
                                    Recuperado
                                </p>
                                <div className="text-balance-large text-slate-800 dark:text-slate-100">
                                    {formatCurrency(stats.totalRecovered, currency)}
                                </div>
                            </div>
                            <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full backdrop-blur-sm">
                                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${stats.totalLent > 0 ? (stats.totalRecovered / stats.totalLent) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </ClairCard>
            </motion.div>
        </motion.div>
    )
}
