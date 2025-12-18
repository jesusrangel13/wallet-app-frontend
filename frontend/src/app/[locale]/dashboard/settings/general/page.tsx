'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { userAPI, accountAPI } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Account } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'

interface UserProfile {
  id: string
  name: string
  email: string
  currency: string
  country?: string
  avatarUrl?: string
  language?: string
}

export default function GeneralSettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const updateUser = useAuthStore((state) => state.updateUser)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currency: 'CLP',
    country: '',
    language: 'es',
    defaultSharedExpenseAccountId: null as string | null,
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const [profileRes, accountsRes] = await Promise.all([
        userAPI.getProfile(),
        accountAPI.getAll(),
      ])

      const user = profileRes.data.data
      // Handle the new response structure from accountAPI.getAll()
      const accountsData = accountsRes.data.data
      const allAccounts = (Array.isArray(accountsData) ? accountsData : accountsData.data).filter(
        (acc: Account) => !acc.isArchived
      )

      setProfile(user)
      setAccounts(allAccounts)
      setFormData({
        name: user.name,
        email: user.email,
        currency: user.currency,
        country: user.country || '',
        language: user.language || 'es',
        defaultSharedExpenseAccountId: user.defaultSharedExpenseAccountId || null,
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || tCommon('errors.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(t('validation.nameRequired'))
      return
    }

    try {
      setIsSaving(true)

      // Update profile and default shared expense account in parallel
      await Promise.all([
        userAPI.updateProfile({
          name: formData.name,
          currency: formData.currency as 'CLP' | 'USD' | 'EUR',
          country: formData.country || undefined,
          language: formData.language,
        }),
        userAPI.updateDefaultSharedExpenseAccount(formData.defaultSharedExpenseAccountId),
      ])

      // Update Zustand store with new user data
      updateUser({
        name: formData.name,
        currency: formData.currency,
        country: formData.country,
        language: formData.language,
      })

      toast.success(t('success.profileUpdated'))
      loadProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.message || tCommon('errors.updateFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Form fields skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="md:col-span-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {formData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('profile.title')}</h2>
              <p className="text-sm text-gray-500">{t('profile.subtitle')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <Input
                  label={t('profile.fields.name')}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('profile.placeholders.name')}
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div className="md:col-span-2">
                <Input
                  label={t('profile.fields.email')}
                  type="email"
                  value={formData.email}
                  disabled
                  helperText={t('profile.fields.emailHelper')}
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.fields.currency')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    required
                  >
                    <option value="CLP">{t('profile.currencies.CLP')}</option>
                    <option value="USD">{t('profile.currencies.USD')}</option>
                    <option value="EUR">{t('profile.currencies.EUR')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('profile.fields.currencyHelper')}</p>
              </div>

              {/* Country */}
              <div>
                <Input
                  label={t('profile.fields.country')}
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t('profile.placeholders.country')}
                />
              </div>

              {/* Language Switcher */}
              <div className="md:col-span-2">
                <LanguageSwitcher />
              </div>

              {/* Default Shared Expense Account */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.fields.defaultAccount')}
                </label>
                <div className="relative">
                  <select
                    value={formData.defaultSharedExpenseAccountId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultSharedExpenseAccountId: e.target.value || null,
                      })
                    }
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="">{t('profile.defaultAccountOptions.none')}</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.currency} ${Number(account.balance).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t('profile.fields.defaultAccountHelper')}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-6 border-t">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" className="text-current" />
                    {t('actions.saving')}
                  </span>
                ) : (
                  t('actions.save')
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={loadProfile}
                disabled={isSaving}
              >
                {t('actions.reset')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      {profile && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">{t('accountDetails.title')}</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('accountDetails.userId')}</p>
                    <p className="text-xs text-gray-500">{t('accountDetails.userIdHelper')}</p>
                  </div>
                </div>
                <span className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-1 rounded">{profile.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('accountDetails.email')}</p>
                    <p className="text-xs text-gray-500">{t('accountDetails.emailHelper')}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-900">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('accountDetails.currency')}</p>
                    <p className="text-xs text-gray-500">{t('accountDetails.currencyHelper')}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{profile.currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
