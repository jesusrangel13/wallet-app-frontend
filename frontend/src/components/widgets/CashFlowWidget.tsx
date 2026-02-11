import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-metric-label flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t('name')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="space-y-3">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`bg-green-50 dark:bg-green-900/20 rounded-lg ${cardPadding} border border-green-100 dark:border-green-800`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="h-3.5 w-3.5 text-income" />
                  <p className={`${cardFontSize} text-income font-medium`}>{t('averageIncome')}</p>
                </div>
                <p className={`${valueFontSize} font-bold text-income`}>
                  <AnimatedCurrency amount={avgIncome} currency="CLP" />
                </p>
              </div>
              <div className={`bg-red-50 dark:bg-red-900/20 rounded-lg ${cardPadding} border border-red-100 dark:border-red-800`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingDown className="h-3.5 w-3.5 text-expense" />
                  <p className={`${cardFontSize} text-expense font-medium`}>{t('averageExpense')}</p>
                </div>
                <p className={`${valueFontSize} font-bold text-expense`}>
                  <AnimatedCurrency amount={avgExpense} currency="CLP" />
                </p>
              </div>
              <div className={`${avgBalance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'} rounded-lg ${cardPadding} border`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <DollarSign className={`h-3.5 w-3.5 ${avgBalance >= 0 ? 'text-blue-600 dark:text-blue-500' : 'text-expense'}`} />
                  <p className={`${cardFontSize} font-medium ${avgBalance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-expense'}`}>{t('netBalance')}</p>
                </div>
                <p className={`${valueFontSize} font-bold ${avgBalance >= 0 ? 'text-blue-900 dark:text-blue-300' : 'text-expense'}`}>
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
          <div className="flex items-center justify-center h-[240px] text-gray-500 dark:text-gray-400">
            {t('noDataAvailable')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
