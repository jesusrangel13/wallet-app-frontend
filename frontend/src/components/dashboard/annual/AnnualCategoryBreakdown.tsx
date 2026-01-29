import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, type Currency } from '@/types/currency';

// Note: verify Progress path. `components/ui/ui/progress` seems wrong. `list_dir components/ui` might clarify. 
// I'll guess standard `components/ui/progress` or implement custom bar.
// I'll use a simple div based progress for safety if I don't confirm.
// Actually, I'll use simple HTML for progress bar to be safe.

interface CategoryItem {
    name: string;
    icon?: string | null;
    color?: string | null;
    amount: number;
    percentage?: number; // Calculated in backend? Backend logic sends totals. Percentage might need calculation.
    // Backend `topCategories` in `getAnnualSummary` logic:
    // "topCategoriesResult = Object.values(categoryAggregates)..."
    // It returns {name, icon, color, amount}. No percentage.
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

    const calculatePercent = (amount: number) => {
        if (totalExpense <= 0) return 0;
        return (amount / totalExpense) * 100;
    };

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
                    <div className="space-y-4">
                        {subcategories.map((sub, i) => {
                            const percent = calculatePercent(sub.amount);
                            return (
                                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
