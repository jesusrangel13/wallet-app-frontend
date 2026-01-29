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
        if (data.length < 2) return <p className="text-muted-foreground text-sm">Selecciona al menos 2 años para ver insights.</p>;

        const sorted = [...data].sort((a: YearData, b: YearData) => b.year - a.year); // Descending for comparison
        const current = sorted[0];
        const previous = sorted[1];

        const insights = [];

        // Income Insight
        const incomeDiff = current.income - previous.income;
        const incomePercent = previous.income > 0 ? (incomeDiff / previous.income) * 100 : 0;
        if (incomePercent > 0) {
            insights.push({
                type: 'positive',
                message: `Tus ingresos aumentaron un ${incomePercent.toFixed(1)}% respecto a ${previous.year}.`
            });
        } else if (incomePercent < 0) {
            insights.push({
                type: 'negative',
                message: `Tus ingresos disminuyeron un ${Math.abs(incomePercent).toFixed(1)}% respecto a ${previous.year}.`
            });
        }

        // Expense Insight
        const expenseDiff = current.expense - previous.expense;
        const expensePercent = previous.expense > 0 ? (expenseDiff / previous.expense) * 100 : 0;
        if (expensePercent > 0) {
            insights.push({
                type: 'warning',
                message: `Tus gastos aumentaron un ${expensePercent.toFixed(1)}% respecto a ${previous.year}.`
            });
        } else if (expensePercent < 0) {
            insights.push({
                type: 'positive',
                message: `Redujiste tus gastos un ${Math.abs(expensePercent).toFixed(1)}% respecto a ${previous.year}.`
            });
        }

        // Savings Rate Insight
        const savingsRateDiff = current.savingsRate - previous.savingsRate;
        if (savingsRateDiff >= 1) {
            insights.push({
                type: 'positive',
                message: `Tu tasa de ahorro mejoró de ${previous.savingsRate.toFixed(1)}% a ${current.savingsRate.toFixed(1)}% (+${savingsRateDiff.toFixed(1)} puntos).`
            });
        } else if (savingsRateDiff <= -1) {
            insights.push({
                type: 'negative',
                message: `Tu tasa de ahorro cayó de ${previous.savingsRate.toFixed(1)}% a ${current.savingsRate.toFixed(1)}% (${savingsRateDiff.toFixed(1)} puntos).`
            });
        }

        return (
            <div className="space-y-3">
                {insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border text-sm">
                        {insight.type === 'positive' && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                        {insight.type === 'negative' && <TrendingDown className="w-5 h-5 text-red-600 shrink-0" />}
                        {insight.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />}
                        <span>{insight.message}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        // Standard fixed overlay fallback
        isOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-background rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b shrink-0">
                        <div>
                            <h2 className="text-xl font-bold">Comparación Anual</h2>
                            <p className="text-sm text-muted-foreground">Analiza tu evolución financiera año a año</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        {/* Year Selector */}
                        <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/30 rounded-lg">
                            <span className="text-sm font-medium">Comparar:</span>
                            {yearOptions.map(year => (
                                <label key={year} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedYears.includes(year)}
                                        onChange={() => toggleYear(year)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                                    />
                                    {year}
                                </label>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Charts Section */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Comparativa de Ingresos y Gastos</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        {loading ? (
                                            <div className="h-full flex items-center justify-center">Cargando...</div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis
                                                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <Tooltip
                                                        formatter={(val: number) => formatCurrency(val, currency)}
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ borderRadius: '8px' }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Ahorro y Tasa de Ahorro</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        {loading ? (
                                            <div className="h-full flex items-center justify-center">Cargando...</div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis
                                                        yAxisId="left"
                                                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        yAxisId="right"
                                                        orientation="right"
                                                        tickFormatter={(val) => `${val}%`}
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <Tooltip
                                                        formatter={(val: number, name) =>
                                                            name === 'Tasa Ahorro' ? `${val.toFixed(1)}%` : formatCurrency(val, currency)
                                                        }
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ borderRadius: '8px' }}
                                                    />
                                                    <Legend />
                                                    <Bar yAxisId="left" dataKey="savings" name="Ahorro ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                    <Bar yAxisId="right" dataKey="savingsRate" name="Tasa Ahorro (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Stats & Insights Side */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Insights Automáticos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {generateInsights()}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Resumen por Año</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[...data].sort((a: YearData, b: YearData) => b.year - a.year).map(d => (
                                            <div key={d.year} className="border-b last:border-0 pb-3 last:pb-0">
                                                <div className="font-bold mb-2">{d.year}</div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="text-muted-foreground">Ingresos:</div>
                                                    <div className="text-right font-medium text-green-600">{formatCurrency(d.income, currency)}</div>

                                                    <div className="text-muted-foreground">Gastos:</div>
                                                    <div className="text-right font-medium text-red-600">{formatCurrency(d.expense, currency)}</div>

                                                    <div className="text-muted-foreground">Ahorro:</div>
                                                    <div className="text-right font-medium text-blue-600">{formatCurrency(d.savings, currency)}</div>

                                                    <div className="text-muted-foreground">Tasa:</div>
                                                    <div className="text-right font-medium text-purple-600">{d.savingsRate.toFixed(1)}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    );
}
