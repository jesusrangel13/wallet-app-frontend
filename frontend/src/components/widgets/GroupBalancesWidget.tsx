'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DollarSign, ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { dashboardAPI } from '@/lib/api'
import { useWidgetDimensions, calculateMaxListItems } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'

interface GroupBalance {
  groupId: string
  groupName: string
  groupCoverImage?: string | null
  userBalance?: number
  totalOwed: number
  members: Array<{
    userId: string
    name: string
    email: string
    balance: number
  }>
}

interface GroupBalancesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const GroupBalancesWidget = ({ gridWidth = 2, gridHeight = 2 }: GroupBalancesWidgetProps) => {
  const t = useTranslations('widgets.groupBalances')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const [balances, setBalances] = useState<GroupBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getGroupBalances({ month, year })
        setBalances(res.data.data)
      } catch (error) {
        console.error('Error fetching group balances:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [month, year])

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('label')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  // Calculate how many groups can fit based on widget height
  // Each group item is approximately 60px tall (collapsed)
  const maxItems = calculateMaxListItems(dimensions.contentHeight, 60)

  // Group and aggregate data - filter groups with non-zero user balance
  const groupedData = balances
    .map((group) => {
      const membersOwing = group.members.filter((member) => member.balance < 0)
      const totalOwed = membersOwing.reduce((sum, member) => sum + Math.abs(member.balance), 0)
      return {
        ...group,
        membersOwing,
        totalOwed,
        memberCount: membersOwing.length,
      }
    })
    .filter((group) => group.userBalance !== 0) // Only show groups where user has a balance

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Mis Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2 p-4">
          {groupedData.length > 0 ? (
            groupedData.slice(0, maxItems).map((group) => {
              const isExpanded = expandedGroups.has(group.groupId)
              const isPositive = (group.userBalance ?? 0) > 0 // Positive = others owe you
              const balanceColor = isPositive ? 'text-green-600' : 'text-red-600'

              return (
                <div key={group.groupId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Group Header - Clickable */}
                  <button
                    onClick={() => toggleGroup(group.groupId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Expand/Collapse Icon */}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      )}

                      {/* Group Icon/Emoji */}
                      {group.groupCoverImage && (
                        <span className="text-lg flex-shrink-0">
                          {group.groupCoverImage}
                        </span>
                      )}

                      {/* Group Name + Count */}
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {group.groupName}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        ({group.memberCount} {group.memberCount === 1 ? t('person') : t('people')})
                      </span>
                    </div>

                    {/* User's Balance in this Group */}
                    <span className={`font-semibold text-sm ${balanceColor} flex-shrink-0 ml-2`}>
                      {formatCurrency(Math.abs(group.userBalance ?? 0), 'CLP')}
                    </span>
                  </button>

                  {/* Expandable Member List */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {group.membersOwing.map((member, index) => (
                        <div
                          key={`${group.groupId}-${member.userId}-${index}`}
                          className="flex items-center justify-between px-4 py-2 border-b border-gray-100 last:border-b-0"
                        >
                          {/* Member Info */}
                          <div className="flex items-center gap-3 flex-1">
                            {/* Small Avatar */}
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                              {member.name.split(' ').map((n) => n[0]).join('')}
                            </div>

                            {/* Name */}
                            <p className="font-medium text-xs text-gray-700 truncate">
                              {member.name}
                            </p>
                          </div>

                          {/* Amount */}
                          <span className="font-semibold text-green-600 text-xs ml-3">
                            {formatCurrency(Math.abs(member.balance), 'CLP')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-gray-500 text-center py-12 text-sm">
              {t('noSharedExpenses')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
