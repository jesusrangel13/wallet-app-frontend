import { useMemo } from 'react'
import { ClairCard } from '@/components/ui/ClairCard'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, Layers, ArrowUpDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useCashFlow } from '@/hooks/useDashboard'
import { CashFlowWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'
import { CashFlowChart, CashFlowVariant } from '@/components/charts/CashFlowChart'

interface CashFlowData {
  month: string
  year?: string
  income: number
  expense: number
}

interface CashFlowWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const CashFlowWidget = ({ gridWidth = 2, gridHeight = 2 }: CashFlowWidgetProps) => {
  const t = useTranslations('widgets.cashFlow')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const { data, isLoading } = useCashFlow(6, { month, year })

  // Memoize expensive calculations
  const statistics = useMemo(() => {
    if (!data || data.length === 0) {
      return { avgIncome: 0, avgExpense: 0, avgBalance: 0 }
    }

    const avgIncome = data.reduce((sum: number, d: CashFlowData) => sum + d.income, 0) / data.length
    const avgExpense = data.reduce((sum: number, d: CashFlowData) => sum + d.expense, 0) / data.length
    const avgBalance = avgIncome - avgExpense

    return { avgIncome, avgExpense, avgBalance }
  }, [data])

  // Transform data for CashFlowChart
  const chartData = useMemo(() => {
    if (!data) return []
    return data.map((d: CashFlowData) => ({
      month: d.month,
      income: d.income,
      expense: d.expense,
      net: d.income - d.expense
    }))
  }, [data])

  const chartConfig = useMemo(() => ({
    chartHeight: calculateChartHeight(dimensions.contentHeight, { hasLegend: true }),
    cardPadding: dimensions.isSmall ? 'p-1.5' : 'p-2',
    cardFontSize: dimensions.isSmall ? 'text-[10px]' : 'text-xs',
    valueFontSize: dimensions.isSmall ? 'text-sm' : 'text-base',
  }), [dimensions])

  if (isLoading) {
    return <CashFlowWidgetSkeleton />
  }

  const { avgIncome, avgExpense, avgBalance } = statistics
  const { chartHeight, cardPadding, cardFontSize, valueFontSize } = chartConfig

  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <TrendingUp className="h-4 w-4" />
          {t('name')}
        </h3>
      </div>
      <div className="p-6">
        {data && data.length > 0 ? (
          <div className="space-y-3">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg flex flex-col items-start gap-1 bg-white/40 dark:bg-white/5 border border-white/20 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-1.5 w-full">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <p className={`${cardFontSize} text-slate-600 dark:text-slate-300 font-medium`}>{t('averageIncome')}</p>
                </div>
                <p className={`${valueFontSize} font-bold text-emerald-700 dark:text-emerald-300`}>
                  <AnimatedCurrency amount={avgIncome} currency="CLP" />
                </p>
              </div>
              <div className="p-3 rounded-lg flex flex-col items-start gap-1 bg-white/40 dark:bg-white/5 border border-white/20 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-1.5 w-full">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <p className={`${cardFontSize} text-slate-600 dark:text-slate-300 font-medium`}>{t('averageExpense')}</p>
                </div>
                <p className={`${valueFontSize} font-bold text-rose-700 dark:text-rose-300`}>
                  <AnimatedCurrency amount={avgExpense} currency="CLP" />
                </p>
              </div>
              <div className="p-3 rounded-lg flex flex-col items-start gap-1 bg-white/40 dark:bg-white/5 border border-white/20 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-1.5 w-full">
                  <DollarSign className={`h-3.5 w-3.5 ${avgBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`} />
                  <p className={`${cardFontSize} text-slate-600 dark:text-slate-300 font-medium`}>{t('netBalance')}</p>
                </div>
                <p className={`${valueFontSize} font-bold ${avgBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  <AnimatedCurrency amount={avgBalance} currency="CLP" />
                </p>
              </div>
            </div>

            {/* CashFlow Chart - Diverging Variant */}
            <CashFlowChart
              data={chartData}
              variant="diverging"
              height={chartHeight}
              currency="CLP"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[240px] text-slate-500 dark:text-slate-400">
            {t('noDataAvailable')}
          </div>
        )}
      </div>
    </ClairCard>
  )
}
