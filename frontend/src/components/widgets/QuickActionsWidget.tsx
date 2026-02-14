'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { Wallet, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions } from '@/hooks/useWidgetDimensions'

interface QuickActionsWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const QuickActionsWidget = ({ gridWidth = 3, gridHeight = 1 }: QuickActionsWidgetProps) => {
  const t = useTranslations('widgets.quickActions')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)

  // Adjust button layout based on widget width
  const buttonLayout = dimensions.isWide ? 'grid-cols-3' : dimensions.width < 600 ? 'grid-cols-1' : 'grid-cols-2'
  const buttonPadding = dimensions.isSmall ? 'px-4 py-2' : 'px-6 py-3'
  const iconSize = dimensions.isSmall ? 'h-4 w-4' : 'h-5 w-5'
  const fontSize = dimensions.isSmall ? 'text-sm' : 'text-base'

  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{t('name')}</h3>
      </div>
      <div className="p-6">
        <div className={`grid ${buttonLayout} gap-4`}>
          <Link href="/dashboard/accounts" prefetch={true} className={`w-full flex items-center justify-center gap-2 bg-blue-600/90 text-white ${buttonPadding} rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md ${fontSize}`}>
            <Wallet className={iconSize} />
            {t('newAccount')}
          </Link>
          <Link href="/dashboard/transactions" prefetch={true} className={`w-full flex items-center justify-center gap-2 bg-emerald-600/90 text-white ${buttonPadding} rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md ${fontSize}`}>
            <TrendingUp className={iconSize} />
            {t('newTransaction')}
          </Link>
          <Link href="/dashboard/groups" prefetch={true} className={`w-full flex items-center justify-center gap-2 bg-purple-600/90 text-white ${buttonPadding} rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md ${fontSize}`}>
            <Users className={iconSize} />
            {t('newLoan')}
          </Link>
        </div>
      </div>
    </ClairCard>
  )
}
