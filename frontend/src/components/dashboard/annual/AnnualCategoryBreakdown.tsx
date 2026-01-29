'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, type Currency } from '@/types/currency';

interface CategoryItem {
    name: string;
    icon?: string | null;
    color?: string | null;
    amount: number;
    percentage?: number;
}

interface SubcategoryItem {
    name: string;
    parentName: string;
    amount: number;
}

interface AnnualCategoryBreakdownProps {
    categories: CategoryItem[];
    subcategories: SubcategoryItem[];
    currency: Currency;
    totalExpense: number;
}

export function AnnualCategoryBreakdown({ categories, subcategories, currency, totalExpense }: AnnualCategoryBreakdownProps) {
    const [displayLimit, setDisplayLimit] = useState(10);
    const observerTarget = useRef<HTMLDivElement>(null);

    const calculatePercent = (amount: number) => {
        if (totalExpense <= 0) return 0;
        return (amount / totalExpense) * 100;
    };

    const displayedSubcategories = subcategories.slice(0, displayLimit);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayLimit < subcategories.length) {
                    setDisplayLimit((prev) => Math.min(prev + 10, subcategories.length));
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [displayLimit, subcategories.length]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Gastos por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {categories.map((cat, i) => {
                            const percent = calculatePercent(cat.amount);
                            return (
                                <div key={i} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            {cat.icon && <span>{cat.icon}</span>}
                                            <span className="font-medium">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold">{formatCurrency(cat.amount, currency)}</span>
                                            <span className="text-xs text-muted-foreground ml-2">({percent.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: cat.color || undefined
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Top Subcategorías</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
                        {displayedSubcategories.map((sub, i) => {
                            const percent = calculatePercent(sub.amount);
                            return (
                                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <p className="text-sm font-medium leading-none">{sub.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{sub.parentName}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-sm">{formatCurrency(sub.amount, currency)}</div>
                                        <div className="text-xs text-muted-foreground">{percent.toFixed(1)}%</div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Sentinel element for infinite scroll */}
                        {displayLimit < subcategories.length && (
                            <div ref={observerTarget} className="h-4 w-full flex justify-center items-center py-4">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
