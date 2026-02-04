'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler'
import { ThemeToggle } from '@/components/ThemeToggle'

// Design Variant
import { LoginSplit } from './components/LoginSplit'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const tv = useTranslations('auth.validation')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const setAuth = useAuthStore((state) => state.setAuth)
  const { handleError } = useGlobalErrorHandler()
  const [isLoading, setIsLoading] = useState(false)

  const loginSchema = z.object({
    email: z.string().email(tv('emailInvalid')),
    password: z.string().min(1, tv('passwordRequired')),
  })

  type LoginForm = z.infer<typeof loginSchema>

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authAPI.login(data)
      const { user, token } = response.data.data

      setAuth(user, token)
      toast.success(t('success'))

      // Check onboarding status
      const { hasCompletedOnboarding } = useAuthStore.getState()

      // If user logs in on a new device, hasCompletedOnboarding is likely false (default),
      // unless we synced it to backend (which we haven't in this phase).
      // So they will be sent to onboarding.
      if (!hasCompletedOnboarding) {
        router.push(`/${locale}/onboarding`)
      } else {
        router.push(`/${locale}/dashboard`)
      }
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

      <LoginSplit
        form={form}
        onSubmit={onSubmit}
        isLoading={isLoading}
        t={t}
        locale={locale}
      />
    </>
  )
}
