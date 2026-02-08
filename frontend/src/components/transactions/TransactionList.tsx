'use client'

import { TransactionCard } from './TransactionCard'
import { TimelineConnector } from './TimelineConnector'

interface Transaction {
    id: string
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
    amount: number
    currency: 'CLP' | 'USD' | 'EUR'
    category: string
    categoryIcon?: string
    categoryColor?: string
    description?: string
    payee?: string
    date: Date
    isShared?: boolean
}

interface TransactionListProps {
    transactions: Transaction[]
    showTimeline?: boolean
    onEdit?: (id: string) => void
}

export function TransactionList({
    transactions,
    showTimeline = true,
    onEdit
}: TransactionListProps) {
    return (
        <div className="divide-y divide-gray-50">
            {transactions.map((transaction, index) => (
                <div key={transaction.id} className="flex">
                    {showTimeline && (
                        <TimelineConnector
                            type={transaction.type}
                            isFirst={index === 0}
                            isLast={index === transactions.length - 1}
                        />
                    )}
                    <div className="flex-1">
                        <TransactionCard
                            {...transaction}
                            onEdit={() => onEdit?.(transaction.id)}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
