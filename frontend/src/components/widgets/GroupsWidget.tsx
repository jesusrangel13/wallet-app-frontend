'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { userAPI } from '@/lib/api'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'

interface GroupsWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const GroupsWidget = ({ gridWidth = 1, gridHeight = 1 }: GroupsWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const [groups, setGroups] = useState(0)
  const [accounts, setAccounts] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await userAPI.getStats()
        setGroups(res.data.data.groups)
        setAccounts(res.data.data.accounts)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-600" />
            Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={`${dimensions.isWide ? 'text-base' : 'text-sm'} font-medium text-gray-600 flex items-center gap-2`}>
          <Users className={`${dimensions.isWide ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />
          Groups
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-gray-900`}>{groups}</div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>{accounts} accounts</p>
      </CardContent>
    </Card>
  )
}
