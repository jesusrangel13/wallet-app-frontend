'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { type Currency } from '@/types/currency';
import { Layers, LayoutList, Grip, CircleDot, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryAccordionView } from './views/CategoryAccordionView';
import { CategoryTreemapView } from './views/CategoryTreemapView';
import { CategorySunburstView } from './views/CategorySunburstView';
import { CategoryMasterDetailView } from './views/CategoryMasterDetailView';

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
}

interface AnnualCategoryBreakdownProps {
    categories: CategoryItem[];
    subcategories: SubcategoryItem[];
    currency: Currency;
    totalExpense: number;
}

type ViewMode = 'accordion' | 'treemap' | 'sunburst' | 'panel';

export function AnnualCategoryBreakdown({ categories, subcategories, currency, totalExpense }: AnnualCategoryBreakdownProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('accordion');

    // Group subcategories by parent
    const subcategoriesByParent = subcategories.reduce((acc, sub) => {
        if (!acc[sub.parentName]) {
            acc[sub.parentName] = [];
        }
        acc[sub.parentName].push(sub);
        return acc;
    }, {} as Record<string, SubcategoryItem[]>);

    const viewOptions = [
        { id: 'accordion', icon: LayoutList, label: 'Lista' },
        { id: 'treemap', icon: Grip, label: 'Mapa' },
        { id: 'sunburst', icon: CircleDot, label: 'Radial' },
        { id: 'panel', icon: Columns, label: 'Panel' },
    ];

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Gastos por categoría
                </CardTitle>
                <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
                    {viewOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setViewMode(option.id as ViewMode)}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === option.id
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                            title={option.label}
                        >
                            <option.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="min-h-[400px]">
                    {viewMode === 'accordion' && (
                        <CategoryAccordionView
                            categories={categories}
                            subcategoriesByParent={subcategoriesByParent}
                            currency={currency}
                            totalExpense={totalExpense}
                        />
                    )}
                    {viewMode === 'treemap' && (
                        <CategoryTreemapView
                            categories={categories}
                            currency={currency}
                        />
                    )}
                    {viewMode === 'sunburst' && (
                        <CategorySunburstView
                            categories={categories}
                            subcategoriesByParent={subcategoriesByParent}
                            currency={currency}
                        />
                    )}
                    {viewMode === 'panel' && (
                        <CategoryMasterDetailView
                            categories={categories}
                            subcategoriesByParent={subcategoriesByParent}
                            currency={currency}
                            totalExpense={totalExpense}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
