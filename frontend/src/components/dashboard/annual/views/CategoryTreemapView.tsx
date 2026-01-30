'use client';

import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { formatCurrency, type Currency } from '@/types/currency';

interface CategoryItem {
    name: string;
    icon?: string | null;
    color?: string | null;
    amount: number;
}

interface CategoryTreemapViewProps {
    categories: CategoryItem[];
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
            {width > 50 && height > 30 && payload?.icon && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={14}
                    fontWeight="bold"
                    dy={-10}
                >
                    {payload.icon} {name}
                </text>
            )}
            {width > 50 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    dy={14}
                >
                    {formatCurrency(value, currency)}
                </text>
            )}
        </g>
    );
};

export function CategoryTreemapView({ categories, currency }: CategoryTreemapViewProps) {
    // Filter out very small categories to keep treemap clean
    const data = categories
        .filter(c => c.amount > 0)
        .map(c => ({
            name: c.name,
            value: c.amount,
            color: c.color,
            icon: c.icon
        }));

    return (
        <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <Treemap
                    data={data}
                    dataKey="value"
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
