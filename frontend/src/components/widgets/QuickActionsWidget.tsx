'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useWidgetDimensions } from '@/hooks/useWidgetDimensions'

interface QuickActionsWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const QuickActionsWidget = ({ gridWidth = 3, gridHeight = 1 }: QuickActionsWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)

  // Adjust button layout based on widget width
  const buttonLayout = dimensions.isWide ? 'grid-cols-3' : dimensions.width < 600 ? 'grid-cols-1' : 'grid-cols-2'
  const buttonPadding = dimensions.isSmall ? 'px-4 py-2' : 'px-6 py-3'
  const iconSize = dimensions.isSmall ? 'h-4 w-4' : 'h-5 w-5'
  const fontSize = dimensions.isSmall ? 'text-sm' : 'text-base'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid ${buttonLayout} gap-4`}>
          <Link href="/dashboard/accounts" className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white ${buttonPadding} rounded-lg hover:bg-blue-700 transition-colors ${fontSize}`}>
            <Wallet className={iconSize} />
            Add Account
          </Link>
          <Link href="/dashboard/transactions" className={`w-full flex items-center justify-center gap-2 bg-green-600 text-white ${buttonPadding} rounded-lg hover:bg-green-700 transition-colors ${fontSize}`}>
            <TrendingUp className={iconSize} />
            New Transaction
          </Link>
          <Link href="/dashboard/groups" className={`w-full flex items-center justify-center gap-2 bg-purple-600 text-white ${buttonPadding} rounded-lg hover:bg-purple-700 transition-colors ${fontSize}`}>
            <Users className={iconSize} />
            Create Group
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
