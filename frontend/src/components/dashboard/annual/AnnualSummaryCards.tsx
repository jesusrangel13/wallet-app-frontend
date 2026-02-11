import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, type Currency } from '@/types/currency';
import { ArrowDown, ArrowUp, TrendingUp, Wallet, PiggyBank, PieChart } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AnnualTotals {
    income: number;
    expense: number;
    personalExpense: number;
    sharedExpense: number;
    savings: number;
    savingsRate: number;
}

interface AnnualSummaryCardsProps {
    totals: AnnualTotals;
    currency: Currency;
}

export function AnnualSummaryCards({ totals, currency }: AnnualSummaryCardsProps) {
    const t = useTranslations('dashboard'); // Assuming dashboard namespace exists, or I should use 'common'

    const cards = [
        {
            title: 'Ingresos',
            value: totals.income,
            icon: TrendingUp,
            color: 'text-income',
            bgClass: 'bg-income-subtle',
            iconClass: 'text-income',
        },
        {
            title: 'Gastos Total',
            value: totals.expense,
            icon: ArrowDown,
            color: 'text-expense',
            bgClass: 'bg-expense-subtle',
            iconClass: 'text-expense',
        },
        {
            title: 'Ahorro',
            value: totals.savings,
            icon: PiggyBank,
            color: 'text-blue-600',
            bgClass: 'bg-blue-100 dark:bg-blue-900/20',
            iconClass: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'Tasa de Ahorro',
            value: totals.savingsRate,
            isPercentage: true,
            icon: PieChart,
            color: 'text-purple-600',
            bgClass: 'bg-purple-100 dark:bg-purple-900/20',
            iconClass: 'text-purple-600 dark:text-purple-400',
        }
    ];

    return (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                        <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {card.title}
                        </CardTitle>
                        <div className={`p-1.5 sm:p-2 rounded-lg ${card.bgClass}`}>
                            <card.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.iconClass}`} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className={`text-base xs:text-lg sm:text-2xl font-bold ${card.color} truncate`}>
                            {card.isPercentage
                                ? `${card.value.toFixed(1)}%`
                                : formatCurrency(card.value, currency)
                            }
                        </div>
                        {/* Optional: Add comparison here if available in data */}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
