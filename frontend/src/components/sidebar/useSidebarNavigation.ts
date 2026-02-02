import { Home, CreditCard, TrendingUp, Users, Upload, HandCoins, CalendarRange } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

export interface NavItem {
    labelKey: string
    icon: React.ComponentType<{ className?: string }>
    path: string
    descriptionKey: string
    label: string
    description: string
    href: string
}

const baseNavItems = [
    { labelKey: 'dashboard', icon: Home, path: 'dashboard', descriptionKey: 'dashboardDescription' },
    { labelKey: 'accounts', icon: CreditCard, path: 'dashboard/accounts', descriptionKey: 'accountsDescription' },
    { labelKey: 'transactions', icon: TrendingUp, path: 'dashboard/transactions', descriptionKey: 'transactionsDescription' },
    { labelKey: 'loans', icon: HandCoins, path: 'dashboard/loans', descriptionKey: 'loansDescription' },
    { labelKey: 'groups', icon: Users, path: 'dashboard/groups', descriptionKey: 'groupsDescription' },
    { labelKey: 'import', icon: Upload, path: 'dashboard/import', descriptionKey: 'importDescription' },
    { labelKey: 'annual', icon: CalendarRange, path: 'dashboard/annual', descriptionKey: 'annualDescription' },
]

export function useSidebarNavigation(locale: string) {
    const t = useTranslations('nav')

    const navItems = useMemo(() => {
        return baseNavItems.map(item => ({
            ...item,
            label: t(item.labelKey as any),
            description: t(item.descriptionKey as any),
            href: `/${locale}/${item.path}`
        }))
    }, [locale, t])

    return navItems
}
