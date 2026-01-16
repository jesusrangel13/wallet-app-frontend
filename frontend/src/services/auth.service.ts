import { apiClient } from './api-client'
import type { ApiResponse, AuthResponse, User, RegisterForm, LoginForm } from '@/types'

export const authAPI = {
  register: (data: RegisterForm) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginForm) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/auth/profile'),
}
