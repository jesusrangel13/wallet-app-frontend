'use client';

import { ClairCard } from "@/components/ui/ClairCard";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { Currency } from "@/types/currency";

interface NetWorthChartProps {
    data: { month: number; amount: number }[];
    currency: Currency;
}

const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function NetWorthChart({ data, currency }: NetWorthChartProps) {
    const formattedData = data.map(d => ({
        ...d,
        name: monthNames[d.month]
    }));

    return (
        <ClairCard className="h-full flex flex-col">
            <div className="flex-none px-6 py-4 border-b border-white/20 dark:border-white/10">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Evolución del Patrimonio (Net Worth)</h3>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Crecimiento acumulado de ahorros en el año</p>
            </div>
            <div className="flex-1 min-h-0 p-6">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <filter id="neon-glow-area-networth" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: '#1e293b'
                                }}
                                formatter={(value: number) => [formatCurrency(value, currency), 'Patrimonio Acumulado']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSavings)"
                                className="filter drop-shadow-[0_4px_6px_rgba(16,185,129,0.3)] dark:filter-[url(#neon-glow-area-networth)] transition-all duration-300"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </ClairCard>
    );
}
