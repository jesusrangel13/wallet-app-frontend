import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import type { Locale } from '@/i18n/config'

interface AuthState {
  user: User | null
  token: string | null
  locale: Locale
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
  setLocale: (locale: Locale) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      locale: 'es' as Locale,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
        }
        // Set locale from user data if available
        const userLocale = (user.language as Locale) || 'es'
        set({ user, token, locale: userLocale, isAuthenticated: true })
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
          // Update locale if language is being updated
          locale: userData.language ? (userData.language as Locale) : state.locale,
        })),

      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
