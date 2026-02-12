'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-none p-4 pb-2">
                <CardTitle className="text-metric-label">Evolución del Patrimonio (Net Worth)</CardTitle>
                <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground">Crecimiento acumulado de ahorros en el año</p>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px'
                                }}
                                formatter={(value: number) => [formatCurrency(value, currency), 'Patrimonio Acumulado']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorSavings)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
