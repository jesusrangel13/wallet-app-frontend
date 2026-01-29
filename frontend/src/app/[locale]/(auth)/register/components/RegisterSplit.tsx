'use client'

import { motion } from 'framer-motion'
import { Wallet, TrendingUp, PieChart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShakeAnimation } from '@/components/ui/animations'
import { RegisterProps } from './types'

export function RegisterSplit({ form, onSubmit, isLoading, t, locale }: RegisterProps) {
    const { register, formState: { errors } } = form

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 p-8 lg:p-20 flex flex-col justify-center relative z-10">
                <div className="max-w-md w-full mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-foreground">FinanceApp</span>
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
                            Comienza tu viaje
                        </h1>
                        <p className="text-lg text-muted-foreground mb-10">
                            Gestiona tu imperio financiero con precisión profesional.
                        </p>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <ShakeAnimation shake={!!errors.name}>
                                    <Input
                                        label={t('fullName')}
                                        placeholder={t('namePlaceholder')}
                                        error={errors.name?.message as string}
                                        {...register('name')}
                                        className="h-12 bg-secondary/30 border-border focus:ring-2 focus:ring-primary transition-all rounded-lg"
                                    />
                                </ShakeAnimation>
                                <ShakeAnimation shake={!!errors.email}>
                                    <Input
                                        label={t('email')}
                                        placeholder={t('emailPlaceholder')}
                                        error={errors.email?.message as string}
                                        {...register('email')}
                                        className="h-12 bg-secondary/30 border-border focus:ring-2 focus:ring-primary transition-all rounded-lg"
                                    />
                                </ShakeAnimation>
                                <ShakeAnimation shake={!!errors.password}>
                                    <Input
                                        type="password"
                                        label={t('password')}
                                        placeholder="••••••••"
                                        error={errors.password?.message as string}
                                        {...register('password')}
                                        className="h-12 bg-secondary/30 border-border focus:ring-2 focus:ring-primary transition-all rounded-lg"
                                    />
                                </ShakeAnimation>
                                <ShakeAnimation shake={!!errors.confirmPassword}>
                                    <Input
                                        type="password"
                                        label={t('confirmPassword')}
                                        placeholder="••••••••"
                                        error={errors.confirmPassword?.message as string}
                                        {...register('confirmPassword')}
                                        className="h-12 bg-secondary/30 border-border focus:ring-2 focus:ring-primary transition-all rounded-lg"
                                    />
                                </ShakeAnimation>
                            </div>

                            <Button
                                type="submit"
                                isLoading={isLoading}
                                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-base rounded-lg shadow-xl shadow-primary/20"
                            >
                                {t('createAccountButton')}
                            </Button>

                            <p className="mt-8 text-center text-sm text-muted-foreground">
                                {t('hasAccount')}{' '}
                                <Link href={`/${locale}/login`} className="font-semibold text-primary hover:underline">
                                    {t('signInLink')}
                                </Link>
                            </p>
                        </form>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Visuals (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 bg-surface-sunken relative items-center justify-center overflow-hidden p-12">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative w-full max-w-lg">
                    {/* Floating Cards */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="absolute top-0 right-0 p-6 bg-card rounded-2xl shadow-lg border border-border w-64 z-20"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-income/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-income" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Crecimiento</p>
                                <p className="font-bold text-foreground">+24.5%</p>
                            </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                transition={{ delay: 1, duration: 1.5 }}
                                className="h-full bg-income"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="bg-primary p-8 rounded-3xl shadow-glow relative z-10 text-primary-foreground mt-16 ml-8"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-medium opacity-80">Futuro Financiero</h3>
                                <div className="text-4xl font-bold mt-2">Ilimitado</div>
                            </div>
                            <PieChart className="w-10 h-10 opacity-80" />
                        </div>
                        <p className="text-primary-foreground/80">Únete a la plataforma que está revolucionando las finanzas personales.</p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
