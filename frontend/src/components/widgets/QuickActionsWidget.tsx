'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

export const QuickActionsWidget = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/accounts">
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <Wallet className="h-5 w-5" />
              Add Account
            </button>
          </Link>
          <Link href="/dashboard/transactions">
            <button className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              <TrendingUp className="h-5 w-5" />
              New Transaction
            </button>
          </Link>
          <Link href="/dashboard/groups">
            <button className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              <Users className="h-5 w-5" />
              Create Group
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
