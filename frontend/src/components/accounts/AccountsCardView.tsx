import { Star, Banknote, CreditCard, Landmark, TrendingUp } from 'lucide-react'
import type { Account, AccountType } from '@/types'
import { formatCurrency, CURRENCIES, type Currency } from '@/types/currency'

interface AccountsCardViewProps {
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

export default function AccountsCardView({
  accounts,
  onNavigate,
}: AccountsCardViewProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account) => {
        const Icon = accountTypeIcons[account.type]
        const isCredit = account.type === 'CREDIT'

        return (
          <div
            key={account.id}
            className="relative group cursor-pointer"
            onClick={() => onNavigate(account.id)}
          >
            {/* Thin left border accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
              style={{ backgroundColor: account.color }}
            />

            {/* Card content - Fixed height */}
            <div className="border border-gray-200 rounded-lg p-4 pl-6 hover:border-gray-300 transition-colors h-[139px] flex flex-col justify-between">
              {/* Top: Name + Default indicator */}
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {account.name}
                </h3>
                {account.isDefault && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                )}
              </div>

              {/* Middle: Balance display */}
              <div className="text-center flex-1 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(Number(account.balance), account.currency as Currency)}
                </div>
                <div className="text-xs text-gray-500 h-3">
                  {isCredit ? 'Available credit' : '\u00A0'}
                </div>
              </div>

              {/* Bottom: Type + Currency */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="capitalize">{account.type.toLowerCase()}</span>
                <span>·</span>
                <span>{CURRENCIES[account.currency as Currency]?.name || account.currency}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
