'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler'

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authAPI.login(data)
      const { user, token } = response.data.data

      setAuth(user, token)
      toast.success(t('success'))
      router.push(`/${locale}/dashboard`)
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('email')}
            type="email"
            placeholder={t('emailPlaceholder')}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label={t('password')}
            type="password"
            placeholder={t('passwordPlaceholder')}
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {t('signInButton')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/register`} className="text-blue-600 dark:text-blue-500 hover:underline">
              {t('signUpLink')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
