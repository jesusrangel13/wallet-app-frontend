'use client'

import { Star, Banknote, CreditCard, Landmark, TrendingUp } from 'lucide-react'
import type { Account, AccountType } from '@/types'
import { AccountCard } from '@/components/widgets/AccountCard'

interface AccountsViewVariantsProps {
    accounts: Account[]
    onNavigate: (accountId: string) => void
}

const accountTypeIcons: Record<AccountType, any> = {
    CASH: Banknote,
    DEBIT: CreditCard,
    CREDIT: CreditCard,
    SAVINGS: Landmark,
    INVESTMENT: TrendingUp,
}

export function AccountsViewVariants({
    accounts,
    onNavigate,
}: AccountsViewVariantsProps) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
                <AccountCard
                    key={account.id}
                    account={{
                        ...account,
                        creditLimit: account.creditLimit || account.creditLimit // Handles null/undefined implicit
                    }}
                    variant="glass"
                    onClick={() => onNavigate(account.id)}
                />
            ))}
        </div>
    )
}
