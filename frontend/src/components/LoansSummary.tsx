'use client'

import { Card, CardContent } from '@/components/ui/Card'
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
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                                    <Wallet className="w-4 h-4" />
                                    Total Prestado
                                </p>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(stats.totalLent, currency)}
                                </div>
                            </div>
                            <div className="p-2 bg-blue-200/50 dark:bg-blue-900/30 rounded-full">
                                <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-blue-600/80 dark:text-blue-400/80">
                            Cartera histórica total
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Pending (At Risk/Receivable) - Highlighted */}
            <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-400/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Por Cobrar
                                </p>
                                <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                                    {formatCurrency(stats.totalPending, currency)}
                                </div>
                            </div>
                            <div className="p-2 bg-orange-200/50 dark:bg-orange-900/30 rounded-full">
                                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs font-medium bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full">
                                {stats.activeCount} activos
                            </span>
                            <span className="text-xs text-orange-600/80 dark:text-orange-400/80">
                                Pendientes de pago
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recovered (Success) */}
            <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                                    <ArrowDownLeft className="w-4 h-4" />
                                    Recuperado
                                </p>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(stats.totalRecovered, currency)}
                                </div>
                            </div>
                            <div className="p-2 bg-green-200/50 dark:bg-green-900/30 rounded-full">
                                <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-green-200 dark:bg-green-900/30 rounded-full h-1.5">
                            <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${stats.totalLent > 0 ? (stats.totalRecovered / stats.totalLent) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
