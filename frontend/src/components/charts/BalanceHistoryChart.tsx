'use client'

import { EnhancedAreaChart } from './EnhancedAreaChart'
import { type Currency } from '@/types/currency'

interface BalanceHistoryDataPoint {
    date: string
    balance: number
}

interface BalanceHistoryChartProps {
    data: BalanceHistoryDataPoint[]
    currency: Currency
    className?: string
}

export function BalanceHistoryChart({ data, currency, className }: BalanceHistoryChartProps) {
    // Map data to EnhancedAreaChart format
    const chartData = data.map(d => ({
        date: d.date,
        value: d.balance
    }))

    // Calculate trend
    const firstValue = chartData.length > 0 ? chartData[0].value : 0
    const lastValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0
    const trend = lastValue - firstValue
    const trendPercentage = firstValue !== 0 ? (trend / firstValue) * 100 : 0

    return (
        <div className={className}>
            <EnhancedAreaChart
                data={chartData}
                title="Historial de Balance"
                currency={currency}
                height={300}
                showTimeSelector={true}
                showComparison={false}
                showForecast={true}
                defaultRange="1M"
            />
        </div>
    )
}
