'use client'

import { useState, useCallback, useMemo } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { TimeRangeSelector } from './TimeRangeSelector'
import { CustomTooltip } from './CustomTooltip'
import { ChartSkeleton } from './ChartSkeleton'

interface DataPoint {
    date: string
    value: number
    previousValue?: number
    forecast?: number
}

interface EnhancedAreaChartProps {
    data: DataPoint[]
    title: string
    currency?: 'CLP' | 'USD' | 'EUR'
    showTimeSelector?: boolean
    height?: number | string
    isLoading?: boolean
    showComparison?: boolean
    showForecast?: boolean

    hideHeader?: boolean
    defaultRange?: string
}

const timeRanges = ['1S', '1M', '3M', '6M', '1A', 'Todo']

export function EnhancedAreaChart({
    data,
    title,
    currency = 'CLP',
    showTimeSelector = true,
    height = 300,
    isLoading = false,
    showComparison = false,
    showForecast = false,
    hideHeader = false,
    defaultRange = '1M'
}: EnhancedAreaChartProps) {
    const [selectedRange, setSelectedRange] = useState(defaultRange)
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const handleMouseMove = useCallback((state: any) => {
        if (state?.activeTooltipIndex !== undefined) {
            setActiveIndex(state.activeTooltipIndex)
        }
    }, [])

    const handleMouseLeave = useCallback(() => {
        setActiveIndex(null)
    }, [])

    // Filter data based on selected range
    const filteredData = useMemo(() => {
        return filterDataByRange(data, selectedRange)
    }, [data, selectedRange])

    // Compute current display value
    const currentValue = useMemo(() => {
        if (activeIndex !== null && filteredData[activeIndex]) {
            return filteredData[activeIndex].value
        }
        // Default to last available value
        if (filteredData.length > 0) {
            return filteredData[filteredData.length - 1].value
        }
        return 0
    }, [activeIndex, filteredData])

    const previousValue = useMemo(() => {
        if (activeIndex !== null && activeIndex > 0) {
            return filteredData[activeIndex - 1]?.value
        }
        return filteredData.length > 1 ? filteredData[filteredData.length - 2]?.value : undefined
    }, [activeIndex, filteredData])

    if (isLoading) {
        return <ChartSkeleton height={height} />
    }

    return (
        <div className="space-y-4 w-full">
            {/* Header with Title, Value, and Selector */}
            {!hideHeader && (
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentValue} // Triggers animation on change
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.2 }}
                                className="text-2xl font-bold text-gray-900 dark:text-gray-100"
                            >
                                {new Intl.NumberFormat('es-CL', {
                                    style: 'currency',
                                    currency,
                                    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
                                }).format(currentValue || 0)}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    {showTimeSelector && (
                        <TimeRangeSelector
                            ranges={timeRanges}
                            selected={selectedRange}
                            onChange={setSelectedRange}
                        />
                    )}
                </div>
            )}

            {/* Chart Area */}
            <div style={{ height }} className="relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={filteredData}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                            <pattern id="diagonalHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <rect width="2" height="4" transform="translate(0,0)" fill="hsl(var(--primary))" fillOpacity={0.1} />
                            </pattern>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--grid-color)"
                            strokeOpacity={0.1}
                        />

                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            dy={10}
                            minTickGap={30}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            tickFormatter={(value) =>
                                new Intl.NumberFormat('es-CL', {
                                    notation: 'compact',
                                    compactDisplay: 'short'
                                }).format(value)
                            }
                            dx={-10}
                        />

                        <Tooltip
                            content={
                                <CustomTooltip
                                    currency={currency}
                                    previousValue={previousValue} // Fallback
                                />
                            }
                            cursor={{
                                stroke: 'hsl(var(--primary))',
                                strokeWidth: 1,
                                strokeDasharray: '5 5'
                            }}
                        />

                        {/* Previous Period Comparison Shadow */}
                        {showComparison && (
                            <Area
                                type="monotone"
                                dataKey="previousValue"
                                stroke="hsl(var(--muted-foreground))"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="none"
                                name="Anterior"
                                isAnimationActive={false}
                                opacity={0.5}
                            />
                        )}

                        {/* Forecast / Projection Area */}
                        {showForecast && (
                            <Area
                                type="monotone"
                                dataKey="forecast"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="url(#diagonalHatch)"
                                name="Proyección"
                            />
                        )}

                        {/* Main Data Line */}
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fill="url(#colorGradient)"
                            animationDuration={1000}
                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

function filterDataByRange(data: DataPoint[], range: string): DataPoint[] {
    if (!data.length) return []

    const now = new Date()
    let startDate: Date

    // This is a simplified filter. Ideally, standard utilities would handle this.
    switch (range) {
        case '1S':
            startDate = new Date(); startDate.setDate(now.getDate() - 7);
            break
        case '1M':
            startDate = new Date(); startDate.setMonth(now.getMonth() - 1);
            break
        case '3M':
            startDate = new Date(); startDate.setMonth(now.getMonth() - 3);
            break
        case '6M':
            startDate = new Date(); startDate.setMonth(now.getMonth() - 6);
            break
        case '1A':
            startDate = new Date(); startDate.setFullYear(now.getFullYear() - 1);
            break
        default:
            return data
    }

    return data.filter(d => new Date(d.date) >= startDate)
}
