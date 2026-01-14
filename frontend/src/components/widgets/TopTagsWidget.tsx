'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, Tag as TagIcon } from 'lucide-react'
import { formatCurrency, type Currency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useTopTags } from '@/hooks/useDashboard'

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
  const t = useTranslations('widgets.topTags')
  const { month, year } = useSelectedMonth()

  // Always fetch top 10
  const fetchCount = 10
  const { data: tags, isLoading } = useTopTags({ month, year, limit: fetchCount })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('label')}
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
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full min-h-0">
        <div
          className="space-y-3 overflow-y-auto pr-2 h-full"
        >
          {tags && tags.length > 0 ? (
            tags.map((tag: TopTagData, index: number) => (
              <div
                key={tag.tagId}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                style={{
                  /* Ensure minimum height/structure doesn't break */
                }}
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
                      {tag.transactionCount} {tag.transactionCount === 1 ? t('transaction') : t('transactions')}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">
                      {t('avg')}: {formatCurrency(tag.averageAmount, 'CLP' as Currency)}
                    </span>
                  </div>
                </div>

                {/* Total amount */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(tag.totalAmount, 'CLP' as Currency)}
                  </p>
                  <p className="text-xs text-gray-500">{t('total')}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <TagIcon className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium">{t('noTaggedTransactions')}</p>
              <p className="text-xs text-gray-400 mt-1 text-center px-4">
                {t('addTagsHint')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
