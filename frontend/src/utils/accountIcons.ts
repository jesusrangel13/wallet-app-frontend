import { Wallet, CreditCard, PiggyBank, TrendingUp, LucideIcon, Landmark } from 'lucide-react'
import { AccountType } from '@/types'

export const getAccountIcon = (accountType: AccountType): LucideIcon => {
  const iconMap: Record<AccountType, LucideIcon> = {
    CASH: Wallet,
    DEBIT: Landmark,
    CREDIT: CreditCard,
    SAVINGS: PiggyBank,
    INVESTMENT: TrendingUp,
  }

  return iconMap[accountType] || Wallet
}
