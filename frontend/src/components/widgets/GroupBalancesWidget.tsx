'use client'

import { ClairCard } from '@/components/ui/ClairCard';
import { DollarSign, ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, calculateMaxListItems } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useGroupBalances } from '@/hooks/useDashboard'
import { GroupBalancesWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency, AnimatedCounter } from '@/components/ui/animations'

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
  const { data: balances, isLoading } = useGroupBalances({ month, year })
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  if (isLoading) {
    return <GroupBalancesWidgetSkeleton />
  }

  // Calculate how many groups can fit based on widget height
  // Each group item is approximately 60px tall (collapsed)
  const maxItems = calculateMaxListItems(dimensions.contentHeight, 60)

  // Group and aggregate data - filter groups with non-zero user balance
  const groupedData = (balances || [])
    .map((group: GroupBalance) => {
      const membersOwing = group.members.filter((member) => member.balance < 0)
      const totalOwed = membersOwing.reduce((sum: number, member) => sum + Math.abs(member.balance), 0)
      return {
        ...group,
        membersOwing,
        totalOwed,
        memberCount: membersOwing.length,
      }
    })
    .filter((group: any) => group.userBalance !== 0) // Only show groups where user has a balance

  return (
    <ClairCard className="h-full">
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <DollarSign className="h-4 w-4 text-indigo-500" />
          {t('title')}
        </h3>
      </div>
      <div className="p-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="space-y-2 p-4">
          {groupedData.length > 0 ? (
            groupedData.slice(0, maxItems).map((group: any) => {
              const isExpanded = expandedGroups.has(group.groupId)
              const isPositive = (group.userBalance ?? 0) > 0 // Positive = others owe you
              // Use specific colors for clearer financial context
              const balanceColor = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'


              return (
                <div key={group.groupId} className="rounded-xl overflow-hidden border border-white/20 shadow-sm backdrop-blur-sm transition-all duration-200">
                  {/* Group Header - Clickable */}
                  <button
                    onClick={() => toggleGroup(group.groupId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Expand/Collapse Icon */}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                      )}

                      {/* Group Icon/Emoji */}
                      {group.groupCoverImage && (
                        <span className="text-lg flex-shrink-0">
                          {group.groupCoverImage}
                        </span>
                      )}

                      {/* Group Name + Count */}
                      <span className="font-medium text-sm text-slate-800 dark:text-white truncate">
                        {group.groupName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                        (<AnimatedCounter value={group.memberCount} decimals={0} /> {group.memberCount === 1 ? t('person') : t('people')})
                      </span>
                    </div>

                    {/* User's Balance in this Group */}
                    <span className={`font-semibold text-sm ${balanceColor} flex-shrink-0 ml-2`}>
                      <AnimatedCurrency amount={Math.abs(group.userBalance ?? 0)} currency="CLP" />
                    </span>
                  </button>

                  {/* Expandable Member List */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-white/20 dark:bg-white/5">
                      {group.membersOwing.map((member: any, index: number) => (
                        <div
                          key={`${group.groupId}-${member.userId}-${index}`}
                          className="flex items-center justify-between px-4 py-2 border-b border-white/5 last:border-b-0"
                        >
                          {/* Member Info */}
                          <div className="flex items-center gap-3 flex-1">
                            {/* Small Avatar */}
                            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm">
                              {member.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>

                            {/* Name */}
                            <p className="font-medium text-xs text-slate-700 dark:text-slate-300 truncate">
                              {member.name}
                            </p>
                          </div>

                          {/* Amount */}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs ml-3">
                            <AnimatedCurrency amount={Math.abs(member.balance)} currency="CLP" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-12 text-sm">
              {t('noSharedExpenses')}
            </p>
          )}
        </div>
      </div>
    </ClairCard>
  )
}
