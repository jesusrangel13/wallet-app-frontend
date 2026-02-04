'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, LayoutDashboard } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useConfetti } from '@/components/ui/animations'

export function LayoutStep() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete)
    const { fire } = useConfetti()
    const [status, setStatus] = useState('configuring') // configuring, success

    useEffect(() => {
        const setupDashboard = async () => {
            // Simulate setup delay (could be real backend calls for presetting widgets)
            await new Promise(resolve => setTimeout(resolve, 1500))

            setStatus('success')
            fire() // Confetti!
            setOnboardingComplete(true)

            // Redirect after showing success state
            setTimeout(() => {
                router.push(`/${locale}/dashboard`)
            }, 2000)
        }

        setupDashboard()
    }, [])

    return (
        <div className="w-full max-w-md mx-auto text-center py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center"
            >
                {status === 'configuring' ? (
                    <>
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
                            <div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <Loader2 className="w-10 h-10 animate-spin" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Configurando tu espacio...</h2>
                        <p className="text-muted-foreground">Estamos preparando tu dashboard personalizado.</p>
                    </>
                ) : (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 bg-green-100/50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-8 mx-auto"
                        >
                            <CheckCircle className="w-10 h-10" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">¡Todo listo!</h2>
                        <p className="text-muted-foreground">Redirigiendo a tu dashboard...</p>
                    </>
                )}
            </motion.div>
        </div>
    )
}
