'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            {t('label')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('errorLoading')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative group">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <HandCoins className="h-4 w-4 text-orange-600 dark:text-orange-500" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary.totalLoans === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('noLoansYet')}</p>
            <Link
              href="/dashboard/loans"
              className="block text-sm text-primary hover:text-primary-hover underline"
            >
              {t('createLoan')} →
            </Link>
          </div>
        ) : (
          <div className="min-h-[120px] flex flex-col justify-center">
            <SummaryView summary={summary} fontSizes={fontSizes} t={t} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
