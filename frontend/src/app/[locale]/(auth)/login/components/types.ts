import { UseFormReturn } from 'react-hook-form'

export interface LoginProps {
    form: UseFormReturn<any>
    onSubmit: (data: any) => Promise<void>
    isLoading: boolean
    t: (key: string) => string
    locale: string
}
