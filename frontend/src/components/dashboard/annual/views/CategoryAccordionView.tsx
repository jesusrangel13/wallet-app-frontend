'use client';

import { useState } from 'react';
import { formatCurrency, type Currency } from '@/types/currency';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface CategoryItem {
    name: string;
    icon?: string | null;
    color?: string | null;
    amount: number;
}

interface SubcategoryItem {
    name: string;
    parentName: string;
    amount: number;
    groupAmount: number;
}

interface CategoryAccordionViewProps {
    categories: CategoryItem[];
    subcategoriesByParent: Record<string, SubcategoryItem[]>;
    currency: Currency;
    totalExpense: number;
}

export function CategoryAccordionView({ categories, subcategoriesByParent, currency, totalExpense }: CategoryAccordionViewProps) {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const calculatePercent = (amount: number, total: number = totalExpense) => {
        if (total <= 0) return 0;
        return (amount / total) * 100;
    };

    const toggleCategory = (name: string) => {
        setExpandedCategory(prev => prev === name ? null : name);
    };

    return (
        <div className="space-y-2">
            {categories.map((cat, i) => {
                const isExpanded = expandedCategory === cat.name;
                const catPercent = calculatePercent(cat.amount);
                const catSubcategories = subcategoriesByParent[cat.name] || [];
                const hasSubcategories = catSubcategories.length > 0;

                return (
                    <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden transition-all">
                        {/* Category Header (Clickable) */}
                        <div
                            onClick={() => hasSubcategories && toggleCategory(cat.name)}
                            className={cn(
                                "flex flex-col p-4 cursor-pointer hover:bg-muted/50 transition-colors relative",
                                isExpanded && "bg-muted/30"
                            )}
                        >
                            {/* Progress Background */}
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full"
                            />
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500"
                                style={{
                                    width: `${catPercent}%`,
                                    backgroundColor: cat.color || undefined
                                }}
                            />

                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-full bg-secondary transition-transform duration-200",
                                        isExpanded && "rotate-90"
                                    )}>
                                        {hasSubcategories ? (
                                            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                        ) : <div className="w-4 h-4" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {cat.icon && <span className="text-xl">{cat.icon}</span>}
                                        <span className="font-semibold text-base">{cat.name}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-base">{formatCurrency(cat.amount, currency)}</div>
                                    <div className="text-xs text-muted-foreground">{catPercent.toFixed(1)}% del total</div>
                                </div>
                            </div>
                        </div>

                        {/* Accordion Body */}
                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="bg-muted/10 p-4 pt-0 border-t border-dashed">
                                        <div className="space-y-3 mt-4 pl-12 pr-4">
                                            {catSubcategories.length > 0 ? (
                                                catSubcategories
                                                    .sort((a, b) => b.amount - a.amount)
                                                    .map((sub, j) => {
                                                        const subPercentOfCat = (sub.amount / cat.amount) * 100;
                                                        return (
                                                            <div key={j} className="space-y-1">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="font-medium text-muted-foreground">{sub.name}</span>
                                                                    <div className="flex gap-3">
                                                                        <span className="font-medium">{formatCurrency(sub.amount, currency)}</span>
                                                                        <span className="text-muted-foreground w-12 text-right">{subPercentOfCat.toFixed(1)}%</span>
                                                                    </div>
                                                                </div>
                                                                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden flex">
                                                                    {/* Personal Portion */}
                                                                    <div
                                                                        className="h-full bg-primary"
                                                                        style={{
                                                                            width: `${(Math.max(0, sub.amount - sub.groupAmount) / cat.amount) * 100}%`,
                                                                            backgroundColor: cat.color || undefined
                                                                        }}
                                                                        title={`Personal: ${formatCurrency(Math.max(0, sub.amount - sub.groupAmount), currency)}`}
                                                                    />
                                                                    {/* Group Portion */}
                                                                    <div
                                                                        className="h-full bg-amber-400/80 dark:bg-amber-500/80"
                                                                        style={{
                                                                            width: `${(sub.groupAmount / cat.amount) * 100}%`
                                                                        }}
                                                                        title={`Grupo: ${formatCurrency(sub.groupAmount, currency)}`}
                                                                    />
                                                                </div>
                                                                {sub.groupAmount > 0 && (
                                                                    <div className="flex justify-end gap-3 text-[10px] text-muted-foreground mt-0.5">
                                                                        <span className="flex items-center gap-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color || 'var(--primary)' }} />
                                                                            Yo: {formatCurrency(Math.max(0, sub.amount - sub.groupAmount), currency)}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                                                                            Grupo: {formatCurrency(sub.groupAmount, currency)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">Sin subcategorías detalladas.</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
