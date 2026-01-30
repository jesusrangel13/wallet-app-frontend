'use client';

import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { formatCurrency, type Currency } from '@/types/currency';

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

interface CategoryTreemapViewProps {
    categories: CategoryItem[];
    subcategoriesByParent: Record<string, SubcategoryItem[]>;
    currency: Currency;
}

const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, name, value, currency } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: payload?.color || '#8884d8',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
                rx={4}
                ry={4}
            />
            {/* Show label only if box is big enough */}
            {width > 60 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={depth === 1 ? 14 : 12} // Larger for Categories (depth 1), smaller for Subs (depth 2)
                    fontWeight={depth === 1 ? "bold" : "normal"}
                    dy={-6}
                >
                    {/* If it's a category (depth 1), show icon + name. If sub (depth 2), just name */}
                    {depth === 1 ? `${payload?.icon || ''} ${name}` : name}
                </text>
            )}
            {width > 60 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={11}
                    dy={12}
                    fillOpacity={0.9}
                >
                    {formatCurrency(value, currency)}
                </text>
            )}
        </g>
    );
};

export function CategoryTreemapView({ categories, subcategoriesByParent, currency }: CategoryTreemapViewProps) {
    // Structure data for Recharts Treemap:
    // Root -> Categories -> Subcategories

    const data = categories
        .filter(c => c.amount > 0)
        .map(c => {
            const subs = subcategoriesByParent[c.name] || [];

            // If has subcategories, map them as children
            const children = subs.length > 0
                ? subs.map(s => ({
                    name: s.name,
                    size: s.amount, // Leaf nodes use 'size' (or whatever dataKey is)
                    color: c.color, // Inherit color logic could be here, but CustomizedContent handles it via payload
                    icon: ''
                }))
                : [{ name: c.name, size: c.amount, color: c.color, icon: c.icon }]; // If no subs, treat cat as leaf

            return {
                name: c.name,
                children: children,
                color: c.color,
                icon: c.icon,
                // Treemap ignores 'value' on parent nodes if children exist, it sums children
            };
        });

    return (
        <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <Treemap
                    data={data}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                    content={<CustomizedContent currency={currency} />}
                >
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value, currency)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                </Treemap>
            </ResponsiveContainer>
        </div>
    );
}
