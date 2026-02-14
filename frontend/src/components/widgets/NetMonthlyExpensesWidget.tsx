'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { Wallet, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMonthlySavings } from '@/hooks/useDashboard'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { MonthlyExpensesWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'
import { Tooltip } from '@/components/ui/Tooltip'

interface NetMonthlyExpensesWidgetProps {
    gridWidth?: number
    gridHeight?: number
}

export const NetMonthlyExpensesWidget = ({ gridWidth = 1, gridHeight = 1 }: NetMonthlyExpensesWidgetProps) => {
    const t = useTranslations('widgets.netMonthlyExpenses')
    const dimensions = useWidgetDimensions(gridWidth, gridHeight)
    const fontSizes = getResponsiveFontSizes(dimensions)
    const { month, year } = useSelectedMonth()

    // Use Monthly Savings hook to get the breakdown of Personal + Shared expenses
    // note: month is 0-indexed here because SavingsWidget and useMonthlySavings expect 0-indexed month
    const { data: savingsResponse, isLoading } = useMonthlySavings({ month, year })

    // Calculate Net Expenses = Personal + Shared (User's share)
    const personal = Number(savingsResponse?.breakdown?.personal || 0)
    const shared = Number(savingsResponse?.breakdown?.shared || 0)
    const netExpenses = personal + shared

    if (isLoading) {
        return <MonthlyExpensesWidgetSkeleton />
    }

    return (
        <ClairCard>
            <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                    <Wallet className="h-4 w-4 text-orange-500" />
                    {t('label')}
                </h3>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    <AnimatedCurrency amount={netExpenses} currency="CLP" />
                </div>
                <div className={`${fontSizes.label} text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1`}>
                    {t('thisMonth')}
                    <Tooltip content={t('tooltip')} side="bottom">
                        <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-help" />
                    </Tooltip>
                </div>
            </div>
        </ClairCard>
    )
}
