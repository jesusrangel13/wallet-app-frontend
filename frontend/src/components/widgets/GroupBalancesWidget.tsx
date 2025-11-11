'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'

interface GroupBalance {
  groupId: string
  groupName: string
  totalOwed: number
  members: Array<{
    userId: string
    name: string
    email: string
    balance: number
  }>
}

export const GroupBalancesWidget = () => {
  const [balances, setBalances] = useState<GroupBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getGroupBalances()
        setBalances(res.data.data)
      } catch (error) {
        console.error('Error fetching group balances:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Group Balances
          </CardTitle>
          <p className="text-sm text-gray-500">People who owe you</p>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Group Balances
        </CardTitle>
        <p className="text-sm text-gray-500">People who owe you</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.length > 0 ? (
            balances.flatMap((group) =>
              group.members
                .filter((member) => member.balance < 0)
                .map((member, index) => (
                  <div
                    key={`${group.groupId}-${member.userId}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{group.groupName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(Math.abs(member.balance), 'CLP')}
                      </p>
                      <p className="text-xs text-gray-500">owes you</p>
                    </div>
                  </div>
                ))
            )
          ) : (
            <p className="text-gray-500 text-center py-8">
              No shared expenses yet. Create a group to start tracking!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
