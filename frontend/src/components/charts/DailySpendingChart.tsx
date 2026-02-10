'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency, type Currency } from '@/types/currency'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface DailyDataPoint {
    date: string
    income: number
    expense: number
}

interface DailySpendingChartProps {
    data: DailyDataPoint[]
    currency: Currency
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
        const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0
        const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0

        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-xl text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {new Date(label).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                {income > 0 && (
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{formatCurrency(income, currency)}</span>
                    </div>
                )}
                {expense > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-expense font-medium">-{formatCurrency(expense, currency)}</span>
                    </div>
                )}
            </div>
        )
    }
    return null
}

export function DailySpendingChart({ data, currency }: DailySpendingChartProps) {
    const [hoveredData, setHoveredData] = useState<DailyDataPoint | null>(null)

    // Calculate totals for the period
    const totalIncome = data.reduce((sum, item) => sum + item.income, 0)
    const totalExpense = data.reduce((sum, item) => sum + item.expense, 0)
    const net = totalIncome - totalExpense

    return (
        <div className="w-full space-y-6">
            {/* Header Stats */}
            <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Daily Activity (Last 30 Days)</p>
                    <div className="flex items-baseline gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-expense-subtle text-expense">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Spent</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpense, currency)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Earned</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalIncome, currency)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={2}>
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickFormatter={(value, index) => {
                                const date = new Date(value)
                                // Show tick every 3-5 days depending on data density? 
                                // For now, let Recharts handle it or force every 5th
                                return index % 5 === 0 ? `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}` : ''
                            }}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'transparent' }} />

                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="a" />
                        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="b" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
