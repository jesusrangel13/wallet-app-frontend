import axios, { AxiosError } from 'axios'
import { safeGetItem, safeRemoveItem } from '@/lib/storage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
  const token = safeGetItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      // Handle 401 Unauthorized - redirect to login
      // Note: 429 and other errors are now handled by component-level error handlers
      // using the global error handler with translated messages
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          safeRemoveItem('token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)
