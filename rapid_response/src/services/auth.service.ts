// services/auth.service.ts — appels API auth (généré api-forge).

import * as v from 'valibot'
import { http } from '@/services/http/axios'
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type RefreshTokenInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@/schema/auth.schema'
import type { AuthResponse, User } from '@/types/user'

export const authService = {
  register: (body: RegisterInput): Promise<AuthResponse> => {
    return http.post<AuthResponse>('/auth/register', v.parse(registerSchema, body)).then((r) => r.data)
  },

  login: (body: LoginInput): Promise<AuthResponse> => {
    return http.post<AuthResponse>('/auth/login', v.parse(loginSchema, body)).then((r) => r.data)
  },

  refresh: (body: RefreshTokenInput): Promise<AuthResponse> => {
    return http.post<AuthResponse>('/auth/refresh', v.parse(refreshTokenSchema, body)).then((r) => r.data)
  },

  forgotPassword: (body: ForgotPasswordInput): Promise<{ message?: string }> => {
    return http.post<{ message?: string }>('/auth/forgot-password', v.parse(forgotPasswordSchema, body)).then((r) => r.data)
  },

  resetPassword: (body: ResetPasswordInput): Promise<void> => {
    return http.post('/auth/reset-password', v.parse(resetPasswordSchema, body)).then(() => undefined)
  },

  logout: (body: RefreshTokenInput): Promise<void> => {
    return http.post('/auth/logout', v.parse(refreshTokenSchema, body)).then(() => undefined)
  },

  me: (): Promise<User> => {
    return http.get<User>('/auth/me').then((r) => r.data)
  }
}

