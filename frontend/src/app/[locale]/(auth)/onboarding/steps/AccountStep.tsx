'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, Smartphone, Landmark, PiggyBank, CircleDollarSign, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useCreateAccount } from '@/hooks/useAccounts'
import { AccountType } from '@/types'
import { toast } from 'sonner'

// Zod schema for validation
const accountSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    type: z.enum(['CASH', 'DEBIT', 'CREDIT', 'SAVINGS', 'INVESTMENT'] as const),
    balance: z.string().transform((val) => Number(val) || 0), // Handle number input as string
    currency: z.enum(['CLP', 'USD', 'EUR']),
})

type AccountForm = z.infer<typeof accountSchema>

export function AccountStep({ onNext }: { onNext: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const createAccountMutation = useCreateAccount()

    const defaultValues: Partial<AccountForm> = {
        name: 'Efectivo',
        type: 'CASH',
        balance: 0,
        currency: 'CLP',
    }

    const form = useForm<AccountForm>({
        resolver: zodResolver(accountSchema),
        defaultValues: defaultValues as any // Casting because balance type transform
    })

    // Account Type options with icons
    const accountTypes: { value: AccountType; label: string; icon: any }[] = [
        { value: 'CASH', label: 'Efectivo', icon: Wallet },
        { value: 'DEBIT', label: 'Débito', icon: Smartphone },
        { value: 'CREDIT', label: 'Crédito', icon: Smartphone }, // Using same icon or similar
        { value: 'SAVINGS', label: 'Ahorros', icon: PiggyBank },
        { value: 'INVESTMENT', label: 'Inversión', icon: Landmark },
    ]

    const onSubmit = async (data: AccountForm) => {
        setIsLoading(true)
        try {
            await createAccountMutation.mutateAsync({
                ...data,
                isDefault: true,
                includeInTotalBalance: true,
                color: '#3b82f6' // Default Blue
            })
            toast.success('Cuenta creada exitosamente')
            onNext()
        } catch (error) {
            toast.error('Error al crear la cuenta')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <CircleDollarSign className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Tu Primera Cuenta</h2>
                <p className="text-muted-foreground">
                    Comencemos creando una cuenta para rastrear tus finanzas.
                </p>
            </motion.div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la cuenta</Label>
                    <Input
                        id="name"
                        placeholder="Ej. Billetera, Banco Santander..."
                        {...form.register('name')}
                        error={form.formState.errors.name?.message}
                    />
                </div>

                {/* Currency Selection */}
                {/* Simplified currency selection using generic div instead of complex Select component if implementation is unknown, 
            but for now using basic html select or custom simple UI to avoid dependencies issues. 
            Using a simple grid for options might be nicer. */}
                <div className="space-y-2">
                    <Label>Moneda</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {['CLP', 'USD', 'EUR'].map((curr) => (
                            <button
                                key={curr}
                                type="button"
                                onClick={() => form.setValue('currency', curr as any)}
                                className={`flex flex-col items-center justify-center py-3 border rounded-lg transition-all ${form.watch('currency') === curr
                                    ? 'border-primary bg-primary/10 text-primary font-medium ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50 hover:bg-accent text-muted-foreground'
                                    }`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                    {form.formState.errors.currency && (
                        <p className="text-sm text-destructive">{form.formState.errors.currency.message}</p>
                    )}
                </div>

                {/* Account Type Selection */}
                <div className="space-y-2">
                    <Label>Tipo de Cuenta</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {accountTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => form.setValue('type', type.value)}
                                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all gap-2 ${form.watch('type') === type.value
                                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50 hover:bg-accent text-muted-foreground'
                                    }`}
                            >
                                <type.icon className="w-5 h-5" />
                                <span className="text-xs font-medium">{type.label}</span>
                            </button>
                        ))}
                    </div>
                    {form.formState.errors.type && (
                        <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                    )}
                </div>

                {/* Balance Input */}
                <div className="space-y-2">
                    <Label htmlFor="balance">Balance Inicial</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">
                            {form.watch('currency') === 'USD' || form.watch('currency') === 'CLP' ? '$' : '€'}
                        </span>
                        <Input
                            id="balance"
                            type="number"
                            className="pl-8"
                            placeholder="0.00"
                            {...form.register('balance')}
                        />
                    </div>
                    {form.formState.errors.balance && (
                        <p className="text-sm text-destructive">{form.formState.errors.balance.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                        </>
                    ) : (
                        'Crear y Continuar'
                    )}
                </Button>
            </form>
        </div>
    )
}
