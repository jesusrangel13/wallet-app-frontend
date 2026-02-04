'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface OnboardingProgressProps {
    currentStep: number
    totalSteps: number
}

export function OnboardingProgress({
    currentStep,
    totalSteps
}: OnboardingProgressProps) {
    return (
        <div className="flex items-center justify-center gap-2 py-8">
            {Array.from({ length: totalSteps }).map((_, index) => {
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep

                return (
                    <div key={index} className="flex items-center">
                        {/* Círculo del paso */}
                        <motion.div
                            initial={false}
                            animate={{
                                scale: isCurrent ? 1.1 : 1,
                                backgroundColor: isCompleted
                                    ? 'hsl(var(--primary))'
                                    : isCurrent
                                        ? 'hsl(var(--primary))'
                                        : 'hsl(var(--muted))'
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${isCompleted || isCurrent
                                    ? 'text-primary-foreground'
                                    : 'text-muted-foreground bg-muted'
                                }`}
                        >
                            {isCompleted ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <span className={isCurrent ? 'text-primary-foreground' : 'text-muted-foreground'}>
                                    {index + 1}
                                </span>
                            )}
                        </motion.div>

                        {/* Línea conectora */}
                        {index < totalSteps - 1 && (
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                                }}
                                className="w-12 h-1 mx-2"
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
