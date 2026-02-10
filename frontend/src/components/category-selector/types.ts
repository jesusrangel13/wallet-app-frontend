import { TransactionType, MergedCategory } from '@/types'

export interface CategoryVariantProps {
    value?: string
    onChange: (categoryId: string) => void
    categories: MergedCategory[]
    type: TransactionType
    label?: string
    error?: string
    onClose?: () => void
}
