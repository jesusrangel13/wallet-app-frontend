'use client'

import { EnhancedBarChart } from './EnhancedBarChart'
import { type Currency } from '@/types/currency'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/types/currency'

interface DailyDataPoint {
    date: string
    income: number
    expense: number
}

interface DailySpendingChartProps {
    data: DailyDataPoint[]
    currency: Currency
}

export function DailySpendingChart({ data, currency }: DailySpendingChartProps) {
    // Calculate totals for the period
    const totalIncome = data.reduce((sum, item) => sum + item.income, 0)
    const totalExpense = data.reduce((sum, item) => sum + item.expense, 0)

    // Map data to EnhancedBarChart format
    // EnhancedBarChart expects { date, value, category?, color? }
    // But EnhancedBarChart is currently designed for single value per bar usually?
    // Let's check EnhancedBarChart props. 
    // It seems EnhancedBarChart takes `data` and renders `value` key.
    // DailySpendingChart shows BOTH income and expense per day.
    // EnhancedBarChart might not support grouped bars (Income AND Expense side-by-side) out of the box if it only looks for `value`.
    // Let's re-read EnhancedBarChart.

    // Wait, if EnhancedBarChart doesn't support dual bars, I might need to adjust it or keep DailySpendingChart as a wrapper that uses
    // a "Stacked" or "Grouped" version if available, OR just use EnhancedBarChart for "Net" or "Expense" only?
    // The original chart showed both.

    // Let's map it to render "Expense" vs "Income" if possible, or maybe just render "Expense" since it's "Spending Chart"?
    // "Daily Activity" implies both.
    // If EnhancedBarChart is strictly single-series, I might need to update EnhancedBarChart to support multiple keys OR
    // just use it for "Net" or "Expense".
    // However, the previous chart showed both.

    // Alternative: Use 2 bar charts? No.
    // Let's see if I can make EnhancedBarChart flexible or if I should just update this file to use the new STYLES (gradients) but keep custom implementation if EnhancedBarChart is too simple.
    // BUT the goal is to use the "Premium" component. 

    // Let's look at EnhancedBarChart again. 
    // It renders: <Bar dataKey="value" ... />

    // If I want two bars, I need to update EnhancedBarChart or use a different one.
    // Actually, `CashFlowChart` has a "bar-comparison" variant that shows Income vs Expense.
    // Maybe I should use `CashFlowChart` here? 
    // `CashFlowChart` variant='bar-comparison' shows Income vs Expense.
    // It takes `data: { date, income, expense }`. 
    // THIS IS A BETTER FIT. 

    // So I will replace DailySpendingChart content with a wrapper around CashFlowChart variant="bar-comparison"
    // OR just import CashFlowChart directly in the page.
    // But to keep the component interface `DailySpendingChart` for the page, I'll wrap it.

    return (
        <div className="w-full space-y-6">
            {/* Header Stats */}
            <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Actividad Diaria (Últimos 30 días)</p>
                    <div className="flex items-baseline gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gastos</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpense, currency)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ingresos</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalIncome, currency)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full mt-4">
                {/* We can use CashFlowChart here as it supports income/expense bars */}
                <CashFlowChartWrapper data={data} currency={currency} />
            </div>
        </div>
    )
}

// Internal wrapper to avoid circular deps if any, or just strictly typing
import { CashFlowChart } from './CashFlowChart'

function CashFlowChartWrapper({ data, currency }: { data: any[], currency: Currency }) {
    return (
        <CashFlowChart
            data={data}
            variant="bar-comparison"
            height={300}
            currency={currency}
        />
    )
}
