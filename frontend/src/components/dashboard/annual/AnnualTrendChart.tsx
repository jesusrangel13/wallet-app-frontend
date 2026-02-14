'use client';

import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ClairCard } from '@/components/ui/ClairCard';
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
        <ClairCard className="col-span-1 lg:col-span-2">
            <div className="p-4 pb-2 border-b border-white/20 dark:border-white/10">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Tendencia Mensual</h3>
            </div>
            <div className="pl-2 pr-4 pb-4 pt-4">
                <div className="h-[350px]">
                    {/* Common Defs */}
                    <svg style={{ height: 0 }}>
                        <defs>
                            <filter id="neon-glow-income-trend" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="neon-glow-expense-trend" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="neon-glow-savings-trend" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                    </svg>

                    {/* Mobile View: Area Chart */}
                    <div className="md:hidden w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="areaIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#34D399" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="areaExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F472B6" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#F472B6" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="areaSavings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#1e293b'
                                    }}
                                    formatter={(value: number) => formatCurrency(value, currency)}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    name="Ingresos"
                                    stroke="#34D399"
                                    fillOpacity={1}
                                    fill="url(#areaIncome)"
                                    strokeWidth={3}
                                    className="filter drop-shadow-[0_4px_6px_rgba(52,211,153,0.3)] dark:filter-[url(#neon-glow-income-trend)]"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    name="Gastos"
                                    stroke="#F472B6"
                                    fillOpacity={1}
                                    fill="url(#areaExpense)"
                                    strokeWidth={3}
                                    className="filter drop-shadow-[0_4px_6px_rgba(244,114,182,0.3)] dark:filter-[url(#neon-glow-expense-trend)]"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="savings"
                                    name="Ahorro"
                                    stroke="#60A5FA"
                                    fillOpacity={1}
                                    fill="url(#areaSavings)"
                                    strokeWidth={3}
                                    className="filter drop-shadow-[0_4px_6px_rgba(96,165,250,0.3)] dark:filter-[url(#neon-glow-savings-trend)]"
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
                                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#34D399" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="annualExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F472B6" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#F472B6" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="annualSavingsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.4} />
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
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: number) => formatCurrency(value, currency)}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#1e293b'
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', color: '#64748b' }} />

                                <Bar
                                    dataKey="income"
                                    name="Ingresos"
                                    fill="url(#annualIncomeGradient)"
                                    radius={[6, 6, 6, 6]}
                                    className="filter drop-shadow-[0_4px_6px_rgba(52,211,153,0.4)] dark:filter-[url(#neon-glow-income-trend)] transition-all duration-300"
                                />
                                <Bar
                                    dataKey="expense"
                                    name="Gastos"
                                    fill="url(#annualExpenseGradient)"
                                    radius={[6, 6, 6, 6]}
                                    className="filter drop-shadow-[0_4px_6px_rgba(244,114,182,0.4)] dark:filter-[url(#neon-glow-expense-trend)] transition-all duration-300"
                                />
                                <Bar
                                    dataKey="savings"
                                    name="Ahorro"
                                    fill="url(#annualSavingsGradient)"
                                    radius={[6, 6, 6, 6]}
                                    className="filter drop-shadow-[0_4px_6px_rgba(96,165,250,0.4)] dark:filter-[url(#neon-glow-savings-trend)] transition-all duration-300"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </ClairCard>
    );
}
