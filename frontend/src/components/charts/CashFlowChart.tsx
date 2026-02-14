'use client'

import { useState, useMemo, useCallback } from 'react'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
    ComposedChart,
    Line,
    Legend
} from 'recharts'
import { formatCurrency } from '@/types/currency'
import { CustomTooltip } from './CustomTooltip'
import { ChartSkeleton } from './ChartSkeleton'

export type CashFlowVariant = 'wave' | 'bar-comparison' | 'diverging' | 'net-trend' | 'hero'

interface CashFlowChartProps {
    data: any[]
    variant: CashFlowVariant
    height?: number
    currency?: 'CLP' | 'USD' | 'EUR'
    isLoading?: boolean
}


export function CashFlowChart({
    data,
    variant,
    height = 300,
    currency = 'CLP',
    isLoading = false
}: CashFlowChartProps) {
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


    // --- Variant 1: Liquid Wave (Overlapping Areas) ---
    if (variant === 'wave') {
        return (
            <div style={{ height }} className="relative w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F472B6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#F472B6" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke="var(--border)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(val)} />
                        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.5 }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area type="monotone" dataKey="income" name="Ingresos" stroke="#06B6D4" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                        <Area type="monotone" dataKey="expense" name="Gastos" stroke="#F472B6" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // --- Variant 2: Comparison Bars (Side by Side) ---
    if (variant === 'bar-comparison') {
        return (
            <div style={{ height }} className="relative w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                        <defs>
                            {/* Filters */}
                            <filter id="neon-glow-income-bar" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="neon-glow-expense-bar" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Gradients */}
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34D399" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#34D399" stopOpacity={0.4} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F472B6" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#F472B6" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(val)} />
                        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar
                            dataKey="income"
                            name="Ingresos"
                            fill="url(#incomeGradient)"
                            radius={[6, 6, 6, 6]}
                            maxBarSize={50}
                            className="filter drop-shadow-[0_4px_6px_rgba(52,211,153,0.4)] dark:filter-[url(#neon-glow-income-bar)] transition-all duration-300"
                        />
                        <Bar
                            dataKey="expense"
                            name="Gastos"
                            fill="url(#expenseGradient)"
                            radius={[6, 6, 6, 6]}
                            maxBarSize={50}
                            className="filter drop-shadow-[0_4px_6px_rgba(244,114,182,0.4)] dark:filter-[url(#neon-glow-expense-bar)] transition-all duration-300"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // --- Variant 3: Diverging Flow (Bi-directional) ---
    if (variant === 'diverging') {
        // Transform data explicitly for diverging chart (expenses negative)
        const divergingData = data.map(d => ({
            ...d,
            divergingExpense: -Math.abs(d.expense)
        }))

        return (
            <div style={{ height }} className="relative w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={divergingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} stackOffset="sign">
                        <defs>
                            {/* Filters */}
                            <filter id="neon-glow-income" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="neon-glow-expense" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Gradients */}
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34D399" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#34D399" stopOpacity={0.4} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F472B6" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#F472B6" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <ReferenceLine y={0} stroke="#9ca3af" />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(Math.abs(val))} />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload) return null;
                                const newPayload = payload.map(p => ({
                                    ...p,
                                    value: Math.abs(Number(p.value))
                                }));
                                return <CustomTooltip active={active} payload={newPayload} label={label} currency={currency} />;
                            }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar
                            dataKey="income"
                            name="Ingresos"
                            fill="url(#incomeGradient)"
                            radius={[6, 6, 6, 6]}
                            className="filter drop-shadow-[0_4px_6px_rgba(52,211,153,0.4)] dark:filter-[url(#neon-glow-income)] transition-all duration-300"
                        />
                        <Bar
                            dataKey="divergingExpense"
                            name="Gastos"
                            fill="url(#expenseGradient)"
                            radius={[6, 6, 6, 6]}
                            className="filter drop-shadow-[0_4px_6px_rgba(244,114,182,0.4)] dark:filter-[url(#neon-glow-expense)] transition-all duration-300"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // --- Variant 5: Hero Gradient Wave (Patrimonio Style) ---
    if (variant === 'hero') {
        const heroData = data.map(d => ({
            ...d,
            // For the hero chart, we might want to visualize the Net Balance trend
            // If net is not available, we calculate it.
            value: d.net !== undefined ? d.net : (d.income - d.expense)
        }))

        return (
            <div style={{ height }} className="relative w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={heroData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="heroGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} /> {/* Violet */}
                                <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.8} /> {/* Cyan */}
                                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.8} /> {/* Cyan Light */}
                            </linearGradient>
                            <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        {/* Minimal or no axes for hero look */}
                        <XAxis dataKey="month" hide />
                        <YAxis hide />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload) return null;
                                return (
                                    <div className="bg-background/80 backdrop-blur-md border border-white/20 rounded-lg p-2 shadow-xl">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                                            <span className="font-bold font-mono">
                                                {formatCurrency(Number(payload[0].value), currency)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            }}
                            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="url(#heroGradient)"
                            strokeWidth={3}
                            fill="url(#heroFill)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )
    }

    return null
}
