'use client';

import { ClairCard } from '@/components/ui/ClairCard';
import { type Currency } from '@/types/currency';
import { Layers } from 'lucide-react';
import { CategoryAccordionView } from './views/CategoryAccordionView';

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

interface AnnualCategoryBreakdownProps {
    categories: CategoryItem[];
    subcategories: SubcategoryItem[];
    currency: Currency;
    totalExpense: number;
}

export function AnnualCategoryBreakdown({ categories, subcategories, currency, totalExpense }: AnnualCategoryBreakdownProps) {
    // Group subcategories by parent
    const subcategoriesByParent = subcategories.reduce((acc, sub) => {
        if (!acc[sub.parentName]) {
            acc[sub.parentName] = [];
        }
        acc[sub.parentName].push(sub);
        return acc;
    }, {} as Record<string, SubcategoryItem[]>);

    return (
        <ClairCard className="h-full flex flex-col">
            <div className="flex-none px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Gastos por categoría
                </h3>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-6">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <CategoryAccordionView
                        categories={categories}
                        subcategoriesByParent={subcategoriesByParent}
                        currency={currency}
                        totalExpense={totalExpense}
                    />
                </div>
            </div>
        </ClairCard>
    );
}
