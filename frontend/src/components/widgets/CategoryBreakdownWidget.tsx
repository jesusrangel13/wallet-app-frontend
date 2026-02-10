'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Layers } from 'lucide-react'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useCategoryBreakdown } from '@/hooks/useDashboard'
import { CategoryAccordionView } from '@/components/dashboard/annual/views/CategoryAccordionView'
import { useTranslations } from 'next-intl'

interface SubcategoryItem {
    name: string;
    parentName: string;
    amount: number;
    groupAmount: number;
}

interface CategoryBreakdownWidgetProps {
    gridWidth?: number
    gridHeight?: number
}

export const CategoryBreakdownWidget = ({ gridWidth = 2, gridHeight = 2 }: CategoryBreakdownWidgetProps) => {
    const t = useTranslations('widgets')
    const { month, year } = useSelectedMonth()
    const { data, isLoading } = useCategoryBreakdown({ month, year })

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    const { categories, subcategories, totalExpense } = data

    // Group subcategories by parent
    const subcategoriesByParent = subcategories.reduce((acc: Record<string, SubcategoryItem[]>, sub: SubcategoryItem) => {
        if (!acc[sub.parentName]) {
            acc[sub.parentName] = [];
        }
        acc[sub.parentName].push(sub);
        return acc;
    }, {} as Record<string, SubcategoryItem[]>);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-none pb-2">
                <CardTitle className="text-metric-label flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    {t('expensesByCategory.name')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                {categories.length > 0 ? (
                    <CategoryAccordionView
                        categories={categories}
                        subcategoriesByParent={subcategoriesByParent}
                        currency="CLP" // TODO: Get from preferences
                        totalExpense={totalExpense}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        No hay gastos este mes
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
