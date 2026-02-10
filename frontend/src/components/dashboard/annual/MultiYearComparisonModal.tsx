'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Removed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button'; // Fixed casing
// import { Checkbox } from '@/components/ui/checkbox'; // Removed
import { dashboardAPI } from '@/services/dashboard.service';
import { formatCurrency, type Currency } from '@/types/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface MultiYearComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentYear: number;
    currency: Currency;
}

interface YearData {
    year: number;
    income: number;
    expense: number;
    savings: number;
    savingsRate: number;
}

export function MultiYearComparisonModal({ isOpen, onClose, currentYear, currency }: MultiYearComparisonModalProps) {
    const [selectedYears, setSelectedYears] = useState<number[]>([currentYear, currentYear - 1]);
    const [data, setData] = useState<YearData[]>([]);
    const [loading, setLoading] = useState(false);

    // Generate last 5 years as options
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: response } = await dashboardAPI.getMultiYearComparison(selectedYears);
                if (response && response.success) {
                    setData(response.data.sort((a: YearData, b: YearData) => a.year - b.year));
                }
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar datos comparativos');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && selectedYears.length > 0) {
            fetchData();
        }
    }, [isOpen, selectedYears]);

    const toggleYear = (year: number) => {
        setSelectedYears(prev => {
            if (prev.includes(year)) {
                if (prev.length === 1) {
                    toast.warning('Debe haber al menos un año seleccionado');
                    return prev;
                }
                return prev.filter(y => y !== year);
            } else {
                if (prev.length >= 3) {
                    toast.warning('Máximo 3 años para comparar');
                    return prev;
                }
                return [...prev, year];
            }
        });
    };

    const generateInsights = () => {
        if (data.length < 2) return <div className="text-center py-6 text-muted-foreground text-sm">Selecciona 2 años para comparar</div>;

        const sorted = [...data].sort((a: YearData, b: YearData) => b.year - a.year); // Descending
        const current = sorted[0];
        const previous = sorted[1];

        const insights = [];

        // Income
        const incomeDiff = current.income - previous.income;
        const incomePercent = previous.income > 0 ? (incomeDiff / previous.income) * 100 : 0;
        insights.push({
            label: 'Ingresos',
            diff: incomeDiff,
            percent: incomePercent,
            positiveIsGood: true
        });

        // Expense
        const expenseDiff = current.expense - previous.expense;
        const expensePercent = previous.expense > 0 ? (expenseDiff / previous.expense) * 100 : 0;
        insights.push({
            label: 'Gastos',
            diff: expenseDiff,
            percent: expensePercent,
            positiveIsGood: false // Lower is better usually
        });

        // Savings Rate
        const savingsRateDiff = current.savingsRate - previous.savingsRate;
        insights.push({
            label: 'Tasa Ahorro',
            value: `${current.savingsRate.toFixed(1)}%`,
            diffValue: `${savingsRateDiff >= 0 ? '+' : ''}${savingsRateDiff.toFixed(1)} pts`,
            positiveIsGood: true,
            isRate: true
        });

        return (
            <div className="grid grid-cols-1 gap-3">
                {insights.map((item, i) => {
                    const isPositive = item.percent ? item.percent > 0 : (parseFloat(item.diffValue || '0') > 0);
                    const isGood = item.positiveIsGood ? isPositive : !isPositive;

                    return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                            <span className="text-sm font-medium">{item.label}</span>
                            <div className="text-right">
                                {item.isRate ? (
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold">{item.value}</span>
                                        <span className={`text-xs ${isGood ? 'text-income' : 'text-expense'}`}>
                                            {item.diffValue} vs {previous.year}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs ${isGood ? 'text-income' : 'text-expense'} font-medium`}>
                                            {item.percent && item.percent > 0 ? '+' : ''}{item.percent?.toFixed(1)}%
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatCurrency(item.diff || 0, currency)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-border flex flex-col ring-1 ring-black/5">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-muted/10">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Comparación Anual</h2>
                        <p className="text-sm text-muted-foreground">Análisis de evolución financiera</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/20">
                        <X className="w-5 h-5 opacity-70" />
                    </Button>
                </div>

                {/* Filters */}
                <div className="px-6 py-3 border-b bg-card flex items-center gap-3 overflow-x-auto shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Años:</span>
                    <div className="flex gap-2">
                        {yearOptions.map(year => {
                            const isSelected = selectedYears.includes(year);
                            return (
                                <button
                                    key={year}
                                    onClick={() => toggleYear(year)}
                                    className={`
                                        px-4 py-1.5 rounded-full text-xs font-medium transition-all
                                        ${isSelected
                                            ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80 ring-1 ring-border'}
                                    `}
                                >
                                    {year}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-muted/5">
                    <div className="grid lg:grid-cols-12 gap-6">
                        {/* Charts Column (Wide) */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Income vs Expense Chart */}
                            <Card className="shadow-sm border-muted/60">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Flujo de Caja (Ingresos vs Gastos)</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-[200px] pt-4">
                                    {loading ? (
                                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground animate-pulse">Cargando datos...</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data} barGap={8} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                                <XAxis
                                                    dataKey="year"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                    fontSize={12}
                                                    className="font-medium"
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    fontSize={11}
                                                    tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                                                    dx={-5}
                                                    className="text-muted-foreground"
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                        fontSize: '12px'
                                                    }}
                                                    formatter={(val: number) => formatCurrency(val, currency)}
                                                />
                                                <Legend iconType="circle" fontSize={12} wrapperStyle={{ paddingTop: '10px' }} />
                                                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} maxBarSize={60} />
                                                <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} maxBarSize={60} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Savings Chart */}
                            <Card className="shadow-sm border-muted/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Evolución del Ahorro</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[160px] pt-4">
                                    {loading ? (
                                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground animate-pulse">Cargando...</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                                <XAxis dataKey="year" axisLine={false} tickLine={false} dy={10} fontSize={12} />
                                                <YAxis yAxisId="left" hide />
                                                <YAxis yAxisId="right" orientation="right" hide />
                                                <Tooltip
                                                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                        fontSize: '12px'
                                                    }}
                                                    formatter={(val: number, name) =>
                                                        name === 'Tasa Ahorro' ? `${val.toFixed(1)}%` : formatCurrency(val, currency)
                                                    }
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                                <Bar yAxisId="left" dataKey="savings" name="Ahorro ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                                <Bar yAxisId="right" dataKey="savingsRate" name="Tasa (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Insights & Metrics Column (Narrow) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Key Comparison Insights */}
                            <Card className="shadow-sm border-l-4 border-l-primary">
                                <CardHeader className="py-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        <CardTitle className="text-sm font-bold">Resumen Comparativo</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 pb-4">
                                    {generateInsights()}
                                </CardContent>
                            </Card>

                            {/* Detailed List */}
                            <Card className="shadow-sm h-fit">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-sm font-bold">Detalle por Año</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 p-0">
                                    <div className="divide-y">
                                        {[...data].sort((a: YearData, b: YearData) => b.year - a.year).map(d => (
                                            <div key={d.year} className="p-4 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-bold text-lg bg-muted px-2 py-0.5 rounded text-foreground">{d.year}</span>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.savingsRate > 20 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        Tasa: {d.savingsRate.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Ingresos</span>
                                                        <span className="font-medium">{formatCurrency(d.income, currency)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Gastos</span>
                                                        <span className="font-medium text-expense">-{formatCurrency(d.expense, currency)}</span>
                                                    </div>
                                                    <div className="pt-2 mt-2 border-t border-dashed flex justify-between">
                                                        <span className="font-medium">Ahorro</span>
                                                        <span className="font-bold text-blue-600">{formatCurrency(d.savings, currency)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
