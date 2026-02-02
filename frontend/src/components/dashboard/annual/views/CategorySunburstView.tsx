'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Sector } from 'recharts';
import { formatCurrency, type Currency } from '@/types/currency';
import { useState } from 'react';

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

interface CategorySunburstViewProps {
    categories: CategoryItem[];
    subcategoriesByParent: Record<string, SubcategoryItem[]>;
    currency: Currency;
}

const renderActiveShape = (props: any, currency: Currency) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={fill} fontSize={24} fontWeight="bold">
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999" fontSize={16}>
                {formatCurrency(value, currency)}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 8}
                outerRadius={outerRadius + 12}
                fill={fill}
            />
        </g>
    );
};

export function CategorySunburstView({ categories, subcategoriesByParent, currency }: CategorySunburstViewProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    // Prepare data for Inner Ring (Categories)
    const categoryData = categories.map(c => ({
        name: c.name,
        value: c.amount,
        color: c.color || '#cccccc',
        icon: c.icon
    }));

    // Prepare data for Outer Ring (Subcategories)
    const subcategoryData: any[] = [];
    categories.forEach(cat => {
        const subs = subcategoriesByParent[cat.name] || [];

        if (subs.length > 0) {
            subs.forEach(sub => {
                subcategoryData.push({
                    name: sub.name,
                    value: sub.amount,
                    color: cat.color ? `${cat.color}99` : '#dddddd', // Translucent
                    parent: cat.name
                });
            });
        } else {
            // Include category itself as outer ring part if no subs, to fill gap
            subcategoryData.push({
                name: cat.name,
                value: cat.amount,
                color: cat.color ? `${cat.color}99` : '#dddddd',
                parent: cat.name
            });
        }
    });

    return (
        <div className="h-[500px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    {/* Inner Ring: Categories */}
                    <Pie
                        activeIndex={activeIndex}
                        activeShape={(props: any) => renderActiveShape(props, currency)}
                        data={categoryData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        fill="#8884d8"
                        onMouseEnter={onPieEnter}
                        paddingAngle={2}
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-cat-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>

                    {/* Outer Ring: Subcategories */}
                    <Pie
                        data={subcategoryData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={130}
                        outerRadius={160}
                        fill="#8884d8"
                        paddingAngle={1}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                            // Only show label if segment is big enough (> 5%)
                            if (percent < 0.05) return null;
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + 25;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                                <text x={x} y={y} fill="#888" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                    {name}
                                </text>
                            );
                        }}
                    >
                        {subcategoryData.map((entry, index) => (
                            <Cell key={`cell-sub-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>

                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
