'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, Tag as TagIcon } from 'lucide-react'
import { formatCurrency, type Currency } from '@/types/currency'
import { useState, useEffect, useMemo } from 'react'
import { dashboardAPI } from '@/lib/api'
import { useWidgetDimensions, calculateMaxListItems } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'

interface TopTagData {
  tagId: string
  tagName: string
  tagColor: string | null
  transactionCount: number
  totalAmount: number
  averageAmount: number
}

interface TopTagsWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

// Default tag color if none specified
const DEFAULT_TAG_COLOR = '#6b7280'

export const TopTagsWidget = ({ gridWidth = 2, gridHeight = 2 }: TopTagsWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const [tags, setTags] = useState<TopTagData[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate how many items can fit based on widget height
  // Each tag item is approximately 88px tall
  const maxItems = useMemo(() => calculateMaxListItems(dimensions.contentHeight, 88), [dimensions.contentHeight])
  // Fetch up to 10 tags maximum
  const fetchCount = useMemo(() => Math.min(Math.max(maxItems, 3), 10), [maxItems])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getTopTags({ month, year, limit: fetchCount })
        setTags(res.data.data || [])
      } catch (error) {
        console.error('Error fetching top tags:', error)
        setTags([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [month, year, fetchCount])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Top Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tags.length > 0 ? (
            tags.slice(0, maxItems).map((tag, index) => (
              <div
                key={tag.tagId}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Rank badge */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>

                {/* Tag icon/color */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tag.tagColor || DEFAULT_TAG_COLOR }}
                >
                  <TagIcon className="h-5 w-5 text-white" />
                </div>

                {/* Tag details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{tag.tagName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">
                      {tag.transactionCount} {tag.transactionCount === 1 ? 'transaction' : 'transactions'}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">
                      Avg: {formatCurrency(tag.averageAmount, 'CLP' as Currency)}
                    </span>
                  </div>
                </div>

                {/* Total amount */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(tag.totalAmount, 'CLP' as Currency)}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <TagIcon className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No tagged transactions</p>
              <p className="text-xs text-gray-400 mt-1 text-center px-4">
                Start adding tags to your transactions to see your most used tags here
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
