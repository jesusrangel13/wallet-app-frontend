import { Account } from '@/types'
import { AccountCard } from '@/components/widgets/AccountCard'

interface AccountHeroCardProps {
    account: Account
    monthlyMetrics?: {
        income: number
        expense: number
    }
}

export function AccountHeroCard({ account, monthlyMetrics }: AccountHeroCardProps) {
    return (
        <AccountCard
            account={{
                ...account,
                accountNumber: account.accountNumber || undefined
            }}
            variant="hero"
            monthlyMetrics={monthlyMetrics}
        />
    )
}
