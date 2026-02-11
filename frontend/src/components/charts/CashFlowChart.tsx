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

export type CashFlowVariant = 'wave' | 'bar-comparison' | 'diverging' | 'net-trend'

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
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(val)} />
                        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '5 5' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area type="monotone" dataKey="income" name="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                        <Area type="monotone" dataKey="expense" name="Gastos" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
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
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(val)} />
                        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar dataKey="income" name="Ingresos" fill="url(#incomeGradient)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="expense" name="Gastos" fill="url(#expenseGradient)" radius={[4, 4, 0, 0]} maxBarSize={50} />
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
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <ReferenceLine y={0} stroke="#9ca3af" />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(Math.abs(val))} />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload) return null;
                                // Custom logic to show positive expense value in tooltip
                                const newPayload = payload.map(p => ({
                                    ...p,
                                    value: Math.abs(Number(p.value))
                                }));
                                return <CustomTooltip active={active} payload={newPayload} label={label} currency={currency} />;
                            }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar dataKey="income" name="Ingresos" fill="url(#incomeGradient)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="divergingExpense" name="Gastos" fill="url(#expenseGradient)" radius={[0, 0, 4, 4]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // --- Variant 4: Net Trend (Composed) ---
    if (variant === 'net-trend') {
        return (
            <div style={{ height }} className="relative w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(val)} />
                        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar dataKey="net" name="Balance Neto" fill="url(#netGradient)" radius={[4, 4, 0, 0]} maxBarSize={50} fillOpacity={1}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.net >= 0 ? 'url(#incomeGradient)' : 'url(#expenseGradient)'} fillOpacity={1} stroke={entry.net >= 0 ? '#10b981' : '#ef4444'} strokeWidth={1} />
                            ))}
                        </Bar>
                        <Line type="monotone" dataKey="income" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="expense" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        )
    }

    return null
}
