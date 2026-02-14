'use client';

import { ClairCard } from "@/components/ui/ClairCard";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { Currency } from "@/types/currency";

interface ExpenseCompositionChartProps {
    data: { fixed: number; variable: number };
    currency: Currency;
}

export function ExpenseCompositionChart({ data, currency }: ExpenseCompositionChartProps) {
    const chartData = [
        { name: 'Gastos Fijos', value: data.fixed, color: '#f59e0b' }, // Amber
        { name: 'Gastos Variables', value: data.variable, color: '#3b82f6' } // Blue
    ];

    const total = data.fixed + data.variable;
    // Prevent division by zero
    const fixedPercent = total > 0 ? (data.fixed / total) * 100 : 0;
    const variablePercent = total > 0 ? (data.variable / total) * 100 : 0;

    return (
        <ClairCard className="flex flex-col h-full">
            <div className="flex-none px-6 py-4 border-b border-white/20 dark:border-white/10">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Fijos vs Variables</h3>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Distribución del gasto anual (Necesidades vs Deseos)</p>
            </div>
            <div className="flex-1 min-h-0 p-6">
                <div className="flex flex-col lg:flex-row items-center h-full gap-4">
                    <div className="flex-1 w-full h-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <defs>
                                    <filter id="neon-glow-pie-composition" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <linearGradient id="fixedExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="variableExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.name === 'Gastos Fijos' ? 'url(#fixedExpenseGradient)' : 'url(#variableExpenseGradient)'}
                                            stroke="none"
                                            className="filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)] dark:filter-[url(#neon-glow-pie-composition)] transition-all duration-300 outline-none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        color: '#1e293b'
                                    }}
                                    formatter={(value: number) => [formatCurrency(value, currency), 'Monto']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full lg:w-1/2 space-y-3 pt-4 lg:pt-0 border-t border-white/10 lg:border-t-0 lg:border-l lg:border-white/10 pl-0 lg:pl-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Gastos Fijos</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold block text-slate-800 dark:text-white">{fixedPercent.toFixed(1)}%</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(data.fixed, currency)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Gastos Variables</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold block text-slate-800 dark:text-white">{variablePercent.toFixed(1)}%</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(data.variable, currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClairCard>
    );
}
