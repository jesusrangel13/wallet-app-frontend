'use client'

import { useState, useMemo } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Sector,
    Tooltip,
} from 'recharts'
import { ChartSkeleton } from './ChartSkeleton'

interface DataPoint {
    name: string
    value: number
    color: string
}

interface EnhancedPieChartProps {
    data: DataPoint[]
    height?: number | string
    currency?: 'CLP' | 'USD' | 'EUR'
    centerText?: string // Header for center text
    isLoading?: boolean
}

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, currency } = props;

    return (
        <g>
            <text x={cx} y={cy - 10} dy={8} textAnchor="middle" className="fill-muted-foreground text-xs" fontSize={12}>
                {payload.name}
            </text>
            <text x={cx} y={cy + 10} dy={8} textAnchor="middle" className="text-xl font-bold fill-foreground">
                {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: currency || 'CLP',
                    notation: 'compact'
                }).format(value)}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={innerRadius - 4}
                outerRadius={outerRadius + 10}
                fill={fill}
                opacity={0.2}
            />
        </g>
    );
};

export function EnhancedPieChart({
    data,
    height = 300,
    currency = 'CLP',
    centerText = 'Total',
    isLoading = false
}: EnhancedPieChartProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index)
    }

    const totalValue = useMemo(() => {
        return data.reduce((sum, item) => sum + item.value, 0)
    }, [data])

    if (isLoading) {
        return <ChartSkeleton height={height} />
    }

    if (!data.length) {
        return (
            <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
                No data available
            </div>
        )
    }

    // Active shape wrapper to pass currency
    const ActiveShape = (props: any) => renderActiveShape({ ...props, currency })

    return (
        <div style={{ height }} className="relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        activeIndex={activeIndex}
                        activeShape={ActiveShape}
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    {/* We hide the default Tooltip because the center text acts as the tooltip */}
                </PieChart>
            </ResponsiveContainer>

            {/* Fallback Center Text if no active index (optional, but ActiveShape handles 0 index by default) */}
            {/* 
         We could add a static center text if we wanted, 
         but the ActiveShape pattern is cleaner for interactivity.
      */}
        </div>
    )
}
