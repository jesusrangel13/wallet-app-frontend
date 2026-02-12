'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-none p-4 pb-2">
                <CardTitle className="text-base sm:text-lg">Fijos vs Variables</CardTitle>
                <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground">Distribución del gasto anual (Necesidades vs Deseos)</p>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <div className="flex flex-col lg:flex-row items-center h-full gap-4">
                    <div className="flex-1 w-full h-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <defs>
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
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.name === 'Gastos Fijos' ? 'url(#fixedExpenseGradient)' : 'url(#variableExpenseGradient)'}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px'
                                    }}
                                    formatter={(value: number) => [formatCurrency(value, currency), 'Monto']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full lg:w-1/2 space-y-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l pl-0 lg:pl-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-sm font-medium">Gastos Fijos</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold block">{fixedPercent.toFixed(1)}%</span>
                                <span className="text-xs text-muted-foreground">{formatCurrency(data.fixed, currency)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-sm font-medium">Gastos Variables</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold block">{variablePercent.toFixed(1)}%</span>
                                <span className="text-xs text-muted-foreground">{formatCurrency(data.variable, currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
