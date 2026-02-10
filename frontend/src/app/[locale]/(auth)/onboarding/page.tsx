'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingProgress } from './components/OnboardingProgress'
import { WelcomeStep } from './steps/WelcomeStep'
import { AccountStep } from './steps/AccountStep'
import { CurrencyStep } from './steps/CurrencyStep'
import { LayoutStep } from './steps/LayoutStep'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useLocale, useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0)
    const router = useRouter()
    const locale = useLocale()
    const t = useTranslations('common')
    const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete)

    const handleSkip = () => {
        setOnboardingComplete(true)
        router.push(`/${locale}/dashboard`)
    }

    const steps = [
        { component: WelcomeStep, id: 'welcome' },
        { component: AccountStep, id: 'account' },
        { component: CurrencyStep, id: 'currency' },
        { component: LayoutStep, id: 'layout' },
    ]

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const CurrentComponent = steps[currentStep].component

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    {/* Logo could go here */}
                    {/* <span className="font-bold text-xl">FinanceApp</span> */}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSkip}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {locale === 'es' ? 'Omitir' : 'Skip'}
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 pt-20">
                {/* Progress Indicator (Skip for Welcome and Layout maybe? But keeping for consistency if desired) */}
                {/* Actually, let's show it from step 1 (Account) onwards or always. The plan showed it. 
             Let's show it for all steps except maybe Welcome if we want a clean landing. 
             But consistency is good. The plan had it everywhere in the screenshot concept. */}
                <div className="w-full max-w-lg mb-8">
                    <OnboardingProgress currentStep={currentStep} totalSteps={steps.length} />
                </div>

                {/* Step Content */}
                <div className="w-full max-w-4xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex justify-center"
                        >
                            <CurrentComponent onNext={handleNext} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
