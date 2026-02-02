'use client';

import { useState } from 'react';
import { formatCurrency, type Currency } from '@/types/currency';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

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

interface CategoryMasterDetailViewProps {
    categories: CategoryItem[];
    subcategoriesByParent: Record<string, SubcategoryItem[]>;
    currency: Currency;
    totalExpense: number;
}

export function CategoryMasterDetailView({ categories, subcategoriesByParent, currency, totalExpense }: CategoryMasterDetailViewProps) {
    const [selectedCategory, setSelectedCategory] = useState<CategoryItem>(categories[0]);

    const calculatePercent = (amount: number, total: number = totalExpense) => {
        if (total <= 0) return 0;
        return (amount / total) * 100;
    };

    const currentSubcategories = selectedCategory ? (subcategoriesByParent[selectedCategory.name] || []) : [];

    return (
        <div className="flex h-[500px] border rounded-lg overflow-hidden bg-card">
            {/* Master List (Left) */}
            <div className="w-1/3 border-r bg-muted/30 overflow-y-auto custom-scrollbar">
                <div className="h-full">
                    <div className="p-2 space-y-1">
                        {categories.map((cat, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors",
                                    selectedCategory?.name === cat.name
                                        ? "bg-primary/10 text-primary border-primary/20 border"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-1.5 h-8 rounded-full"
                                        style={{ backgroundColor: cat.color || '#ccc' }}
                                    />
                                    <div>
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            {cat.icon} {cat.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{formatCurrency(cat.amount, currency)}</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail View (Right) */}
            <div className="w-2/3 flex flex-col h-full bg-card">
                {selectedCategory ? (
                    <div className="flex flex-col h-full">
                        {/* Detail Header */}
                        <div className="p-6 border-b bg-muted/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-secondary rounded-xl text-2xl">
                                        {selectedCategory.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedCategory.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {calculatePercent(selectedCategory.amount).toFixed(1)}% del gasto total
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">
                                        {formatCurrency(selectedCategory.amount, currency)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subcategories List inside Detail */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Desglose Detallado</h4>
                            <div className="space-y-4">
                                {currentSubcategories.length > 0 ? (
                                    currentSubcategories
                                        .sort((a, b) => b.amount - a.amount)
                                        .map((sub, j) => {
                                            const subPercent = (sub.amount / selectedCategory.amount) * 100;
                                            return (
                                                <div key={j} className="group">
                                                    <div className="flex justify-between items-end mb-1">
                                                        <span className="font-medium text-sm">{sub.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-muted-foreground">{subPercent.toFixed(1)}%</span>
                                                            <span className="font-bold text-sm">{formatCurrency(sub.amount, currency)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="absolute top-0 left-0 h-full transition-all duration-500 rounded-full"
                                                            style={{
                                                                width: `${subPercent}%`,
                                                                backgroundColor: selectedCategory.color || 'var(--primary)'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                        <p>No hay subcategorías registradas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Selecciona una categoría para ver detalles
                    </div>
                )}
            </div>
        </div>
    );
}
