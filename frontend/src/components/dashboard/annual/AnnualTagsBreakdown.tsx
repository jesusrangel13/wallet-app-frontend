'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, type Currency } from '@/types/currency';
import { Tag } from 'lucide-react';

interface TagItem {
    name: string;
    color?: string | null;
    amount: number;
    count: number;
}

interface AnnualTagsBreakdownProps {
    tags: TagItem[];
    currency: Currency;
    totalExpense: number;
}

export function AnnualTagsBreakdown({ tags, currency, totalExpense }: AnnualTagsBreakdownProps) {
    const [displayLimit, setDisplayLimit] = useState(10);
    const observerTarget = useRef<HTMLDivElement>(null);

    const calculatePercent = (amount: number) => {
        if (totalExpense <= 0) return 0;
        return (amount / totalExpense) * 100;
    };

    const displayedTags = tags.slice(0, displayLimit);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayLimit < tags.length) {
                    setDisplayLimit((prev) => Math.min(prev + 10, tags.length));
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [displayLimit, tags.length]);

    if (!tags || tags.length === 0) {
        return null;
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-none">
                <CardTitle className="text-metric-label flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Top Etiquetas
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {displayedTags.map((tag, i) => {
                        const percent = calculatePercent(tag.amount);
                        return (
                            <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-8 rounded-sm shrink-0"
                                        style={{ backgroundColor: tag.color || '#94a3b8' }}
                                    />
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium leading-none">{tag.name}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{tag.count} transacciones</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-xs sm:text-sm">{formatCurrency(tag.amount, currency)}</div>
                                    <div className="text-[10px] sm:text-xs text-muted-foreground">{percent.toFixed(1)}%</div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Sentinel element for infinite scroll */}
                    {displayLimit < tags.length && (
                        <div ref={observerTarget} className="h-4 w-full flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
