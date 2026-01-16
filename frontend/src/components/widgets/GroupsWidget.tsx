'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useUserStats } from '@/hooks/useUser'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { GroupsWidgetSkeleton } from '@/components/ui/WidgetSkeletons';

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-gray-900`}>{groups}</div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>{groups} {t('groupsCount')}, {accounts} {t('membersCount')}</p>
      </CardContent>
    </Card>
  )
}
