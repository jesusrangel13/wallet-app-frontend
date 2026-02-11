'use client'

import { useState, useCallback, useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { AnimatePresence, motion } from 'framer-motion'
import { CustomTooltip } from './CustomTooltip'
import { ChartSkeleton } from './ChartSkeleton'

interface DataPoint {
    date: string
    value: number
    previousValue?: number // For comparison
    category?: string
    color?: string
}

interface EnhancedBarChartProps {
    data: DataPoint[]
    title?: string
    currency?: 'CLP' | 'USD' | 'EUR'
    height?: number | string
    isLoading?: boolean
    showComparison?: boolean
    layout?: 'vertical' | 'horizontal'
}

export function EnhancedBarChart({
    data,
    title,
    currency = 'CLP',
    height = 300,
    isLoading = false,
    showComparison = false,
    layout = 'horizontal'
}: EnhancedBarChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const handleMouseMove = useCallback((state: any) => {
        if (state?.activeTooltipIndex !== undefined) {
            setActiveIndex(state.activeTooltipIndex)
        }
    }, [])

    const handleMouseLeave = useCallback(() => {
        setActiveIndex(null)
    }, [])

    if (isLoading) {
        return <ChartSkeleton height={height} />
    }

    return (
        <div className="space-y-4 w-full">
            {title && (
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            )}

            <div style={{ height }} className="relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout={layout}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        barGap={4}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={layout === 'horizontal' ? false : true}
                            horizontal={layout === 'horizontal' ? true : false}
                            stroke="var(--grid-color)"
                            strokeOpacity={0.1}
                        />

                        {layout === 'horizontal' ? (
                            <>
                                <XAxis
                                    dataKey="date" // or category
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    dy={10}
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
                            </>
                        ) : (
                            <>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="category"
                                    type="category"
                                    width={100}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                            </>
                        )}

                        <Tooltip
                            content={
                                <CustomTooltip
                                    currency={currency}
                                />
                            }
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        />

                        {showComparison && (
                            <Bar
                                dataKey="previousValue"
                                fill="hsl(var(--muted-foreground))"
                                radius={[4, 4, 0, 0]}
                                opacity={0.3}
                                name="Anterior"
                            />
                        )}

                        <Bar
                            dataKey="value"
                            fill="hsl(var(--primary))"
                            radius={layout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0]}
                            animationDuration={1000}
                            name="Actual"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color || (activeIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--primary))')}
                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
