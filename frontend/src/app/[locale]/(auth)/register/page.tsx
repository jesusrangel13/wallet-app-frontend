'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { authAPI } from '@/lib/api'
import { useConfetti } from '@/components/ui/animations'
import { useAuthStore } from '@/store/authStore'
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler'
import { ThemeToggle } from '@/components/ThemeToggle'

// Design Variant
import { RegisterSplit } from './components/RegisterSplit'

export default function RegisterPage() {
  const t = useTranslations('auth.register')
  const tv = useTranslations('auth.validation')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const setAuth = useAuthStore((state) => state.setAuth)
  const { handleError } = useGlobalErrorHandler()
  const [isLoading, setIsLoading] = useState(false)
  const { fire } = useConfetti()

  const registerSchema = z.object({
    name: z.string().min(2, tv('nameMinLength')),
    email: z.string().email(tv('emailInvalid')),
    password: z.string().min(8, tv('passwordMinLength')),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: tv('passwordMismatch'),
    path: ['confirmPassword'],
  })

  type RegisterForm = z.infer<typeof registerSchema>

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const { confirmPassword, ...registerData } = data
      const response = await authAPI.register(registerData)
      const { user, token } = response.data.data

      setAuth(user, token)
      toast.success(t('success'))
      fire()
      // Delay redirect slightly to show confetti
      setTimeout(() => {
        router.push(`/${locale}/dashboard`)
      }, 1000)
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Theme Toggle (Top Right) */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle size="lg" />
      </div>

      <RegisterSplit
        form={form}
        onSubmit={onSubmit}
        isLoading={isLoading}
        t={t}
        locale={locale}
      />
    </>
  )
}
