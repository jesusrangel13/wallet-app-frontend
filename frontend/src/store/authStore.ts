import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import type { Locale } from '@/i18n/config'
import { safeStorage, safeSetItem, safeRemoveItem } from '@/lib/storage'

interface AuthState {
  user: User | null
  token: string | null
  locale: Locale
  isAuthenticated: boolean
  isHydrated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
  setLocale: (locale: Locale) => void
  setHydrated: () => void
  hasCompletedOnboarding: boolean
  setOnboardingComplete: (complete: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      locale: 'es' as Locale,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, token) => {
        // Store token separately for API access
        safeSetItem('token', token)
        // Set locale from user data if available
        const userLocale = (user.language as Locale) || 'es'
        set({ user, token, locale: userLocale, isAuthenticated: true })
      },

      clearAuth: () => {
        safeRemoveItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
          // Update locale if language is being updated
          locale: userData.language ? (userData.language as Locale) : state.locale,
        })),

      setLocale: (locale) => set({ locale }),
      setHydrated: () => set({ isHydrated: true }),
      hasCompletedOnboarding: false,
      setOnboardingComplete: (complete) => set({ hasCompletedOnboarding: complete }),
    }),
    {
      name: 'auth-storage',
      storage: safeStorage,
      // Only persist essential data, exclude isAuthenticated (derived from token)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        locale: state.locale,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true
          if (state.token) {
            state.isAuthenticated = true
          }
        }
      },
    }
  )
)
