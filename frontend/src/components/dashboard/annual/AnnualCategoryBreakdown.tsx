'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-none">
                <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Gastos por categoría
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <CategoryAccordionView
                        categories={categories}
                        subcategoriesByParent={subcategoriesByParent}
                        currency={currency}
                        totalExpense={totalExpense}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
