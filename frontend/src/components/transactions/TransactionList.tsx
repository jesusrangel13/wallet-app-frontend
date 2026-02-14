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
    onEdit,
}: TransactionListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }



    return (
        <div className={`
            relative
            space-y-0
            pl-4 border-l border-white/10
        `}>
            {/* Continuous Line for Morphing Variant (Absolute) - Removed */}

            {transactions.map((transaction, index) => {
                const isSelected = selectedIds.has(transaction.id)

                return (
                    <div
                        key={transaction.id}
                        className={`
                            flex group/item isolate relative
                            pl-4
                        `}
                    >
                        {/* Glass Track Highlight Background */}
                        {isSelected && (
                            <div className="absolute inset-0 bg-primary/5 border-l-2 border-primary z-[-1]" />
                        )}

                        {showTimeline && (
                            <TimelineConnector
                                type={transaction.type}
                                isFirst={index === 0}
                                isLast={index === transactions.length - 1}
                                isSelected={isSelected}
                                onToggle={() => toggleSelection(transaction.id)}
                            />
                        )}

                        <div className="flex-1 min-w-0">
                            <TransactionCard
                                {...transaction}
                                isSelected={isSelected}
                                onToggleSelection={() => toggleSelection(transaction.id)}
                                onEdit={() => onEdit?.(transaction.id)}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

import { useState } from 'react'
