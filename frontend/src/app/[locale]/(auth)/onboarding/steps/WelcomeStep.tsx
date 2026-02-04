'use client'

import { motion } from 'framer-motion'
import { TrendingUp, PieChart, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTranslations } from 'next-intl'

export function WelcomeStep({ onNext }: { onNext: () => void }) {
    // We can add translations later, for now hardcoding or using params if needed
    // Ideally we should use useTranslations, but I will stick to the plan structure.
    // The plan had hardcoded text in Spanish. I will assume we want to keep it consistent or use what was shown.
    // Actually, I should check if I should add translations now.
    // The prompt asked for "todo en español" (everything in Spanish). I will write the text directly in Spanish as per the reference,
    // but wrapping it in useTranslations would be better practice.
    // Given the strict plan, I will implement as approved in the plan (which was Spanish text).

    const benefits = [
        {
            icon: TrendingUp,
            title: 'Control Total',
            description: 'Visualiza ingresos y gastos de todos tus clientes'
        },
        {
            icon: PieChart,
            title: 'Insights Inteligentes',
            description: 'Entiende a dónde va tu dinero automáticamente'
        },
        {
            icon: Users,
            title: 'Gastos Compartidos',
            description: 'Divide facturas con socios o colaboradores'
        },
        {
            icon: Zap,
            title: 'Para Freelancers',
            description: 'Separa gastos personales y de negocio fácilmente'
        }
    ]

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl font-bold text-foreground mb-4">
                    Bienvenido a <span className="text-primary">FinanceApp</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-md mx-auto">
                    La forma más inteligente de manejar tus finanzas como freelancer
                </p>
            </motion.div>

            {/* Benefits Grid */}
            {/* Replaced grid-cols-1 md:grid-cols-2 with generic grid for better responsive control if needed, but keeping simple */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
                {benefits.map((benefit, index) => (
                    <motion.div
                        key={benefit.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * (index + 1) }}
                        className="flex items-start gap-4 p-4 rounded-xl bg-card hover:bg-accent/50 transition-colors border border-border"
                    >
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <benefit.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* CTA */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <Button size="lg" onClick={onNext} className="px-12 text-lg h-12">
                    Comenzar
                </Button>
            </motion.div>
        </div>
    )
}
