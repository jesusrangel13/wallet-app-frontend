'use client';

import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, type Currency } from '@/types/currency';

interface MonthlyTrendData {
    month: number;
    income: number;
    expense: number;
    savings: number;
}

interface AnnualTrendChartProps {
    data: MonthlyTrendData[];
    currency: Currency;
}

const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function AnnualTrendChart({ data, currency }: AnnualTrendChartProps) {
    const chartData = data.map(d => ({
        ...d,
        name: monthNames[d.month - 1]
    }));

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {/* Mobile View: Area Chart */}
                        <div className="md:hidden w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="areaExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={50}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                        formatter={(value: number) => formatCurrency(value, currency)}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        name="Ingresos"
                                        stroke="#22c55e"
                                        fillOpacity={1}
                                        fill="url(#areaIncome)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Gastos"
                                        stroke="#ef4444"
                                        fillOpacity={1}
                                        fill="url(#areaExpense)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Desktop View: Bar Chart */}
                        <div className="hidden md:block w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="annualIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                                        </linearGradient>
                                        <linearGradient id="annualExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                                        </linearGradient>
                                        <linearGradient id="annualSavingsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: number) => formatCurrency(value, currency)}
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                    <Bar dataKey="income" name="Ingresos" fill="url(#annualIncomeGradient)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Gastos" fill="url(#annualExpenseGradient)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="savings" name="Ahorro" fill="url(#annualSavingsGradient)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
