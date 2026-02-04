'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Globe, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { userAPI } from '@/lib/api' // using userAPI to update profile
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { User, AccountType } from '@/types' // Importing types

const currencySchema = z.object({
    currency: z.enum(['CLP', 'USD', 'EUR']),
    country: z.string().optional(), // Optional for now
})

type CurrencyForm = z.infer<typeof currencySchema>

export function CurrencyStep({ onNext }: { onNext: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const { user, updateUser } = useAuthStore()

    const defaultValues: Partial<CurrencyForm> = {
        currency: (user?.currency as any) || 'USD',
        country: user?.country || '',
    }

    const form = useForm<CurrencyForm>({
        resolver: zodResolver(currencySchema),
        defaultValues
    })

    const currencies = [
        { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸' },
        { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
        { code: 'CLP', name: 'Peso Chileno', symbol: '$', flag: '🇨🇱' },
    ]

    const onSubmit = async (data: CurrencyForm) => {
        setIsLoading(true)
        try {
            // API call to update user profile
            await userAPI.updateProfile({ // Assuming updateProfile takes Partial<User>
                currency: data.currency,
                country: data.country || undefined // Or map from currency if needed
            } as Partial<User>)

            // Update local store
            updateUser({
                currency: data.currency,
                country: data.country
            })

            toast.success('Preferencias actualizadas')
            onNext()
        } catch (error) {
            toast.error('Error al actualizar preferencias')
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
                <div className="w-16 h-16 bg-green-100/50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                    <Globe className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Configuración Regional</h2>
                <p className="text-muted-foreground">
                    Personaliza tu experiencia seleccionando tu moneda principal.
                </p>
            </motion.div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3">
                    <Label>Moneda Principal</Label>
                    <div className="grid gap-3">
                        {currencies.map((curr) => (
                            <div
                                key={curr.code}
                                onClick={() => form.setValue('currency', curr.code as any)}
                                className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${form.watch('currency') === curr.code
                                    ? 'border-green-600 bg-green-50/50 dark:bg-green-900/30 ring-2 ring-green-100 dark:ring-green-900/30'
                                    : 'border-border hover:border-primary/50 hover:bg-accent'
                                    }`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <span className="text-2xl">{curr.flag}</span>
                                    <div>
                                        <p className="font-semibold text-foreground">{curr.code}</p>
                                        <p className="text-sm text-muted-foreground">{curr.name}</p>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-muted-foreground/70">
                                    {curr.symbol}
                                </div>
                                {form.watch('currency') === curr.code && (
                                    <div className="absolute top-4 right-4 text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Esta será la moneda predeterminada para tus reportes. Puedes agregar otras cuentas con diferentes monedas más tarde.
                    </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        'Confirmar y Continuar'
                    )}
                </Button>
            </form>
        </div>
    )
}
