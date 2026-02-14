'use client'

import { ClairCard } from '@/components/ui/ClairCard';
import { TrendingUp, Tag as TagIcon } from 'lucide-react'
import { formatCurrency, type Currency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useTopTags } from '@/hooks/useDashboard'
import { TopTagsWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency, AnimatedCounter } from '@/components/ui/animations'

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
    return <TopTagsWidgetSkeleton />
  }

  return (
    <ClairCard className="h-full">
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          {t('label')}
        </h3>
      </div>
      <div className="h-full min-h-0 flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 p-4 space-y-3 overflow-y-auto custom-scrollbar"
        >
          {tags && tags.length > 0 ? (
            tags.map((tag: TopTagData, index: number) => (
              <div
                key={tag.tagId}
                className="item-glow p-3"

              >
                {/* Rank badge */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {index + 1}
                </div>

                {/* Tag icon/color */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: tag.tagColor || DEFAULT_TAG_COLOR }}
                >
                  <TagIcon className="h-5 w-5 text-white" />
                </div>

                {/* Tag details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white truncate">{tag.tagName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      <AnimatedCounter value={tag.transactionCount} decimals={0} /> {tag.transactionCount === 1 ? t('transaction') : t('transactions')}
                    </span>
                    <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('avg')}: <AnimatedCurrency amount={tag.averageAmount} currency="CLP" />
                    </span>
                  </div>
                </div>

                {/* Total amount */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-slate-800 dark:text-white">
                    <AnimatedCurrency amount={tag.totalAmount} currency="CLP" />
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('total')}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <TagIcon className="h-12 w-12 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">{t('noTaggedTransactions')}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center px-4">
                {t('addTagsHint')}
              </p>
            </div>
          )}
        </div>
      </div>
    </ClairCard>
  )
}
