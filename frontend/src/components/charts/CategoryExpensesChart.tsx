'use client'

import { useState, useMemo, useCallback } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Treemap
} from 'recharts'
import { formatCurrency } from '@/types/currency'
import { CustomTooltip } from './CustomTooltip'
import { ChartSkeleton } from './ChartSkeleton'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

import { EnhancedBarChart } from './EnhancedBarChart'

export type CategoryVariant = 'smart-list' | 'treemap' | 'donut-pro' | 'radar' | 'comparison'

interface CategoryData {
    name: string
    value: number
    color?: string
    percent?: number
    previousValue?: number
}

interface CategoryExpensesChartProps {
    data: CategoryData[]
    variant: CategoryVariant
    height?: number
    currency?: 'CLP' | 'USD' | 'EUR'
    isLoading?: boolean
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6']

export function CategoryExpensesChart({
    data,
    variant,
    height = 300,
    currency = 'CLP',
    isLoading = false
}: CategoryExpensesChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    // Ensure data has colors
    const enhancedData = useMemo(() => {
        return data.map((item, index) => ({
            ...item,
            color: item.color || COLORS[index % COLORS.length]
        })).sort((a, b) => b.value - a.value)
    }, [data])

    // --- Shared Gradients Helper ---

    if (isLoading) {
        return <ChartSkeleton height={height} />
    }

    // --- Variant 1: Smart List (Horizontal Bars) ---
    if (variant === 'smart-list') {
        const maxValue = Math.max(...enhancedData.map(d => d.value))

        return (
            <div style={{ height }} className="overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                    {enhancedData.map((item, index) => (
                        <div key={index} className="group relative">
                            <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="font-medium text-foreground">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold block text-foreground">
                                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(item.value)}
                                    </span>
                                </div>
                            </div>
                            {/* Progress Bar Background */}
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                {/* Active Progress */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.value / maxValue) * 100}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}80 100%)`
                                    }}
                                />
                            </div>
                            <div className="text-[10px] text-muted-foreground text-right mt-0.5">
                                {((item.value / enhancedData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}% del total
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // --- Variant 2: Treemap (Custom Grid implementation for better control) ---
    if (variant === 'treemap') {
        // A simplified treemap visualization using CSS Grid/Flexbox logic for "blocks"
        // Since real treemap algorithm is complex, we'll use a visual approximation or Recharts if suitable.
        // Recharts Treemap is often hard to style text inside. Let's try a grid of "Cards".
        return (
            <div style={{ height }} className="relative w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={enhancedData}
                        dataKey="value"
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomTreemapContent />}
                    >
                        <defs>
                            {COLORS.map((color, index) => (
                                <linearGradient key={index} id={`categoryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                                </linearGradient>
                            ))}
                        </defs>
                    </Treemap>
                </ResponsiveContainer>
            </div>
        )
    }

    // --- Variant 3: Donut Pro (Pie + Side Legend) ---
    if (variant === 'donut-pro') {
        return (
            <div style={{ height }} className="flex flex-col sm:flex-row items-center gap-4">
                {/* Chart Side */}
                <div className="w-full sm:w-1/2 h-full min-h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                {COLORS.map((color, index) => (
                                    <linearGradient key={index} id={`categoryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                data={enhancedData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                {enhancedData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#categoryGradient-${index % COLORS.length})`}
                                        strokeWidth={activeIndex === index ? 2 : 0}
                                        stroke="#fff"
                                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip currency={currency} />} />
                            {/* Center Text */}
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold" fill="currentColor">
                                    {activeIndex !== null ? `${((enhancedData[activeIndex].value / enhancedData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%` : 'Total'}
                                </tspan>
                                <tspan x="50%" dy="1.5em" fontSize="12" fill="#6b7280">
                                    {activeIndex !== null ? enhancedData[activeIndex].name : 'Gastos'}
                                </tspan>
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend Side */}
                <div className="w-full sm:w-1/2 h-full overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {enhancedData.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${activeIndex === index ? 'bg-muted' : 'hover:bg-muted/50'}`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: item.color }} />
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">{item.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{((item.value / enhancedData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                            <span className="text-xs font-bold">
                                {new Intl.NumberFormat('es-CL', { notation: 'compact', style: 'currency', currency }).format(item.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // --- Variant 4: Radar (Polar) ---
    if (variant === 'radar') {
        return (
            <div style={{ height }} className="relative w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={enhancedData}>
                        <PolarGrid strokeOpacity={0.2} />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar
                            name="Gastos"
                            dataKey="value"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.5}
                        />
                        <Tooltip content={<CustomTooltip currency={currency} />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // --- Variant 5: Comparison (Bar Chart) ---
    if (variant === 'comparison') {
        const comparisonData = enhancedData.map(d => ({
            date: d.name,
            value: d.value,
            previousValue: d.previousValue,
            category: d.name,
            color: d.color
        }))

        return (
            <div style={{ height }} className="relative w-full">
                <EnhancedBarChart
                    data={comparisonData}
                    height={height}
                    currency={currency}
                    layout="vertical"
                    showComparison={true}
                />
            </div>
        )
    }

    return null
}

// Helper for Treemap content
const CustomTreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, name, value, percent } = props;

    // Safety checks for potentially undefined props
    const safeName = name || (payload && payload.name) || '';
    // Use gradient if index is available, otherwise fallback color
    const safeFill = `url(#categoryGradient-${index % COLORS.length})`;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: safeFill,
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {width > 30 && height > 30 && (
                <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={10}>
                    {safeName.length > (width / 6) ? `${safeName.substring(0, Math.floor(width / 6))}..` : safeName}
                </text>
            )}
            {width > 30 && height > 30 && (
                <text x={x + width / 2} y={y + height / 2 - 7} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">
                    {new Intl.NumberFormat('en', { notation: 'compact' }).format(value)}
                </text>
            )}
        </g>
    );
};
