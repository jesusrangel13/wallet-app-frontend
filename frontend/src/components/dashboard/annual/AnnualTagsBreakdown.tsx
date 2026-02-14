'use client';

import { useState, useEffect, useRef } from 'react';
import { ClairCard } from '@/components/ui/ClairCard';
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
        <ClairCard className="h-full flex flex-col">
            <div className="flex-none px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                    <Tag className="w-4 h-4 text-indigo-500" />
                    Top Etiquetas
                </h3>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-6 relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 absolute inset-0 p-6">
                    {displayedTags.map((tag, i) => {
                        const percent = calculatePercent(tag.amount);
                        return (
                            <div key={i} className="item-glow p-3">
                                {/* Rank Badge */}
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {i + 1}
                                </div>

                                {/* Tag Color Pill/Bar - Adjusted for new layout */}
                                <div
                                    className="w-1.5 h-8 rounded-full shrink-0 mx-2"
                                    style={{ backgroundColor: tag.color || '#94a3b8' }}
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{tag.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {tag.count} transacciones
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="font-bold text-sm text-slate-800 dark:text-white">
                                        {formatCurrency(tag.amount, currency)}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {percent.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Sentinel element for infinite scroll */}
                    {displayLimit < tags.length && (
                        <div ref={observerTarget} className="h-4 w-full flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                        </div>
                    )}
                </div>
            </div>
        </ClairCard>
    );
}
