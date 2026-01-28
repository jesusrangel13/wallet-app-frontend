import { UseFormReturn } from 'react-hook-form'

export interface RegisterProps {
    form: UseFormReturn<any>
    onSubmit: (data: any) => Promise<void>
    isLoading: boolean
    t: (key: string) => string
    locale: string
}
