'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useUserStats } from '@/hooks/useUser'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { GroupsWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCounter } from '@/components/ui/animations'

interface GroupsWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const GroupsWidget = ({ gridWidth = 1, gridHeight = 1 }: GroupsWidgetProps) => {
  const t = useTranslations('widgets.groups')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)

  // Use React Query hook for automatic caching and revalidation
  const { data: stats, isLoading } = useUserStats()

  const groups = stats?.groups || 0
  const accounts = stats?.accounts || 0

  if (isLoading) {
    return <GroupsWidgetSkeleton />
  }

  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <Users className="h-4 w-4" />
          {t('label')}
        </h3>
      </div>
      <div className="p-6">
        <div className={`${fontSizes.value} font-bold text-slate-800 dark:text-white`}>
          <AnimatedCounter value={groups} decimals={0} />
        </div>
        <p className={`${fontSizes.label} text-slate-500 dark:text-slate-400 mt-1`}>
          <AnimatedCounter value={groups} decimals={0} /> {t('groupsCount')}, <AnimatedCounter value={accounts} decimals={0} /> {t('membersCount')}
        </p>
      </div>
    </ClairCard>
  )
}
