'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ClairCard } from '@/components/ui/ClairCard'
import { HandCoins } from 'lucide-react'
import { loanAPI } from '@/lib/api'
import { LoansSummary } from '@/types'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { SummaryView } from './LoanWidgetViews'
import { LoansWidgetSkeleton } from '@/components/ui/WidgetSkeletons';

interface LoansWidgetProps {
  gridWidth?: number
  gridHeight?: number
}



export const LoansWidget = ({ gridWidth = 1, gridHeight = 1 }: LoansWidgetProps) => {
  const t = useTranslations('widgets.loans')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const [summary, setSummary] = useState<LoansSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(false)

        // Fetch summary
        const summaryRes = await loanAPI.getSummary()
        setSummary(summaryRes.data.data)

      } catch (err) {
        console.error('Error fetching loans data:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])



  if (loading) {
    return <LoansWidgetSkeleton />
  }

  if (error || !summary) {
    return (
      <ClairCard>
        <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
            <HandCoins className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            {t('label')}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('errorLoading')}</p>
        </div>
      </ClairCard>
    )
  }

  return (
    <ClairCard className="relative group">
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <HandCoins className="h-4 w-4 text-orange-600 dark:text-orange-500" />
          {t('label')}
        </h3>
      </div>
      <div className="p-6">
        {summary.totalLoans === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('noLoansYet')}</p>
            <Link
              href="/dashboard/loans"
              className="block text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 underline"
            >
              {t('createLoan')} →
            </Link>
          </div>
        ) : (
          <div className="min-h-[120px] flex flex-col justify-center">
            <SummaryView summary={summary} fontSizes={fontSizes} t={t} />
          </div>
        )}
      </div>
    </ClairCard>
  )
}
