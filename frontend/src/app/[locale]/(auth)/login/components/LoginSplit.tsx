'use client'

import { motion } from 'framer-motion'
import { Wallet, PieChart, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShakeAnimation } from '@/components/ui/animations'
import { LoginProps } from './types'

export function LoginSplit({ form, onSubmit, isLoading, t, locale }: LoginProps) {
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
                            Bienvenido de nuevo
                        </h1>
                        <p className="text-lg text-muted-foreground mb-10">
                            Gestiona tu imperio financiero con precisión profesional.
                        </p>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <ShakeAnimation shake={!!errors.email}>
                                    <Input
                                        label={t('email')}
                                        placeholder="ejemplo@empresa.com"
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
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                                    <span className="text-sm text-muted-foreground">Recordarme</span>
                                </label>
                                <a href="#" className="text-sm font-medium text-primary hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                isLoading={isLoading}
                                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-base rounded-lg shadow-xl shadow-primary/20"
                            >
                                Inicar Sesión
                            </Button>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-background text-muted-foreground">
                                        O continúa con
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" className="flex items-center justify-center h-12 border border-border rounded-lg hover:bg-secondary transition-colors">
                                    <span className="font-medium text-foreground">Google</span>
                                </button>
                                <button type="button" className="flex items-center justify-center h-12 border border-border rounded-lg hover:bg-secondary transition-colors">
                                    <span className="font-medium text-foreground">Apple</span>
                                </button>
                            </div>
                        </form>

                        <p className="mt-8 text-center text-sm text-muted-foreground">
                            ¿No tienes cuenta?{' '}
                            <Link href={`/${locale}/register`} className="font-semibold text-primary hover:underline">
                                Regístrate ahora
                            </Link>
                        </p>
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
                                <h3 className="text-lg font-medium opacity-80">Balance Total</h3>
                                <div className="text-4xl font-bold mt-2">$124,500.00</div>
                            </div>
                            <PieChart className="w-10 h-10 opacity-80" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-black/10 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent-gold" />
                                    <span className="text-sm">Inversiones</span>
                                </div>
                                <span className="font-medium">$84,000</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-black/10 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent-purple" />
                                    <span className="text-sm">Ahorros</span>
                                </div>
                                <span className="font-medium">$40,500</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
