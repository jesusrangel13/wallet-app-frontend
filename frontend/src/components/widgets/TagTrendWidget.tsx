'use client'

import { useMemo, useState } from 'react'
import { ClairCard } from '@/components/ui/ClairCard'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useTagTrend } from '@/hooks/useDashboard'
import { TagTrendWidgetSkeleton } from '@/components/ui/WidgetSkeletons';
import { CustomTooltip } from '@/components/charts/CustomTooltip'

interface TagTrendData {
  tagId: string
  tagName: string
  tagColor: string | null
  monthlyData: Array<{
    month: number
    year: number
    amount: number
  }>
}

interface TagTrendWidgetProps {
  gridWidth?: number
  gridHeight?: number
  settings?: {
    tagIds?: string[]
    months?: number
  }
}

// Default colors for tags without a color assigned
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
]

// Month abbreviations
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const TagTrendWidget = ({
  gridWidth = 3,
  gridHeight = 2,
  settings = {}
}: TagTrendWidgetProps) => {
  const t = useTranslations('widgets.tagTrend')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const [data, setData] = useState<any[]>([])
  const [tags, setTags] = useState<TagTrendData[]>([])

  const months = settings.months || 6
  const tagIds = useMemo(() => settings.tagIds || [], [settings.tagIds])

  const { data: rawData, isLoading } = useTagTrend(months, tagIds.length > 0 ? tagIds : undefined)

  // Calculate responsive sizes
  const chartHeight = calculateChartHeight(dimensions.contentHeight)
  const fontSize = dimensions.isSmall ? 10 : 12
  const strokeWidth = dimensions.isSmall ? 1.5 : 2

  // Transform data for the chart
  useMemo(() => {
    if (rawData && rawData.length > 0) {
      const tagsData = rawData
      setTags(tagsData)

      const monthlyPoints: Record<string, any> = {}

      // Get all unique months from the first tag (they all have the same months)
      const allMonths = tagsData[0].monthlyData

      allMonths.forEach((monthData: any) => {
        const key = `${MONTH_NAMES[monthData.month - 1]} ${monthData.year}`
        monthlyPoints[key] = { month: key }

        // Add data for each tag
        tagsData.forEach((tag: TagTrendData) => {
          const tagMonthData = tag.monthlyData.find(
            (m: any) => m.month === monthData.month && m.year === monthData.year
          )
          monthlyPoints[key][tag.tagName] = tagMonthData ? tagMonthData.amount : 0
        })
      })

      setData(Object.values(monthlyPoints))
    } else {
      setData([])
      setTags([])
    }
  }, [rawData])

  // Memoize chart configuration
  const chartConfig = useMemo(() => {
    const chartHeight = calculateChartHeight(dimensions.contentHeight)
    const fontSize = dimensions.isSmall ? 10 : 12
    const strokeWidth = dimensions.isSmall ? 1.5 : 2

    return { chartHeight, fontSize, strokeWidth }
  }, [dimensions])

  if (isLoading) {
    return <TagTrendWidgetSkeleton />
  }


  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <TrendingUp className="h-4 w-4" />
          {t('label')} ({t('lastMonths', { months })})
        </h3>
      </div>
      <div className="p-6 flex-1 flex flex-col min-h-0">
        {data.length > 0 && tags.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    currency="CLP"
                  />
                }
                cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="line"
              />
              {tags.map((tag, index) => (
                <Line
                  key={tag.tagId}
                  type="monotone"
                  dataKey={tag.tagName}
                  stroke={tag.tagColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  strokeWidth={strokeWidth}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400"
            style={{ height: chartHeight }}
          >
            <TrendingUp className="h-12 w-12 mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm">{t('noTagData')}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center px-4">
              {tagIds.length > 0
                ? t('selectedTagsNoHistory')
                : t('addTagsForTrends')}
            </p>
          </div>
        )}
      </div>
    </ClairCard>
  )
}
