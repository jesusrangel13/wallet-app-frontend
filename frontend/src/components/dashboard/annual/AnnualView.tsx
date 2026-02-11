'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { AnnualSummaryCards } from './AnnualSummaryCards';
import { AnnualTrendChart } from './AnnualTrendChart';
import { AnnualCategoryBreakdown } from './AnnualCategoryBreakdown';
import { MultiYearComparisonModal } from './MultiYearComparisonModal';
import { AnnualViewSkeleton } from '@/components/ui/PageSkeletons';
import { AnnualTagsBreakdown } from './AnnualTagsBreakdown';
import { NetWorthChart } from './NetWorthChart';
import { ExpenseCompositionChart } from './ExpenseCompositionChart';
import { dashboardAPI } from '@/services/dashboard.service';
import type { Currency } from '@/types/currency';

// Define Interface for Annual Data Response
interface AnnualData {
    year: number;
    totals: {
        income: number;
        expense: number;
        personalExpense: number;
        sharedExpense: number;
        savings: number;
        savingsRate: number;
    };
    monthlyTrend: {
        month: number;
        income: number;
        expense: number;
        savings: number;
    }[];
    netWorthData: {
        month: number;
        amount: number;
    }[];
    expenseComposition: {
        fixed: number;
        variable: number;
    };
    people?: any[]; // Potentially for future "People" breakdown if needed
    topTags: {
        name: string;
        color: string | null;
        amount: number;
        count: number;
    }[];
    topCategories: any[];
    topSubcategories: any[];
}

export function AnnualView() {
    const t = useTranslations('dashboard');
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<AnnualData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isComparisonOpen, setIsComparisonOpen] = useState(false);

    // Use a simple fetch for now as we don't have a configured API client method for this yet
    // or use existing api client if possible. 
    // I will check `lib/api.ts` later but for now I'll use fetch with auth token logic if needed
    // Or better, assume `userAPI` can be extended or used directly if I add the method.
    // For safety, I'll use standard fetch to `/api/v1/dashboard/annual` (assuming prefix).
    // Wait, backend routes are `/dashboard/annual`. Prefix usually `/api`.
    // I'll try to find where other requests go.
    // I'll stick to a relative path `/api/dashboard/annual` assuming proxy or base URL configuration.

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const { data: response } = await dashboardAPI.getAnnualSummary(year);
                if (response && response.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar datos anuales');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [year]);

    const prevYear = () => setYear(y => y - 1);
    const nextYear = () => setYear(y => y + 1);

    if (loading) {
        return <AnnualViewSkeleton />;
    }

    if (!data) return <div className="p-8">No data</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Vista Anual</h2>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => setIsComparisonOpen(true)}
                        className="text-xs sm:text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 sm:px-4 py-2 rounded-md transition-colors flex-1 sm:flex-none whitespace-nowrap"
                    >
                        Comparar años
                    </button>
                    <div className="flex items-center gap-2 sm:gap-4 bg-card p-1 sm:p-2 rounded-lg border shadow-sm">
                        <button onClick={prevYear} className="p-1 sm:p-2 hover:bg-muted rounded-full">
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className="font-bold text-lg sm:text-xl min-w-[2.5rem] sm:min-w-[3rem] text-center">{year}</span>
                        <button onClick={nextYear} className="p-1 sm:p-2 hover:bg-muted rounded-full">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <MultiYearComparisonModal
                isOpen={isComparisonOpen}
                onClose={() => setIsComparisonOpen(false)}
                currentYear={year}
                currency={'CLP' as Currency}
            />

            <AnnualSummaryCards totals={data.totals} currency={'CLP' as Currency} />

            {/* 1. Monthly Trend Chart (100% Width) */}
            <AnnualTrendChart data={data.monthlyTrend} currency={'CLP' as Currency} />

            {/* 2. Detailed Breakdown Grid (2 Columns, Fixed Height on Desktop/Responsive on Mobile) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[900px]">
                {/* Left Column: Categories & Net Worth */}
                <div className="flex flex-col gap-6 lg:h-full">
                    <div className="h-[350px] lg:h-auto lg:flex-1 lg:max-h-[600px] min-h-0">
                        <AnnualCategoryBreakdown
                            categories={data.topCategories}
                            subcategories={data.topSubcategories}
                            currency={'CLP' as Currency}
                            totalExpense={data.totals.expense}
                        />
                    </div>
                    <div className="h-[300px] lg:h-auto lg:flex-1 lg:max-h-[300px] min-h-0">
                        <NetWorthChart data={data.netWorthData} currency={'CLP' as Currency} />
                    </div>
                </div>

                {/* Right Column: Fixed/Variable & Tags */}
                <div className="flex flex-col gap-6 lg:h-full">
                    <div className="h-[300px] lg:h-auto lg:flex-1 lg:max-h-[300px] min-h-0">
                        <ExpenseCompositionChart data={data.expenseComposition} currency={'CLP' as Currency} />
                    </div>
                    <div className="h-[350px] lg:h-auto lg:flex-1 lg:max-h-[600px] min-h-0">
                        <AnnualTagsBreakdown
                            tags={data.topTags}
                            currency={'CLP' as Currency}
                            totalExpense={data.totals.expense}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
