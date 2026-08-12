'use client'

// hooks/useAuth.ts — hooks TanStack Query auth (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { authKeys } from '@/keys/auth.keys'
import { setAccessToken } from '@/services/http/axios'
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@/schema/auth.schema'

export const useMe = () =>
  useQuery({
    queryKey: authKeys.detail('me'),
    queryFn: () => authService.me(),
  })

export const useRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RegisterInput) => authService.register(body),
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      queryClient.setQueryData(authKeys.detail('me'), data.user)
    },
  })
}

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: LoginInput) => authService.login(body),
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      queryClient.setQueryData(authKeys.detail('me'), data.user)
    },
  })
}

export const useRefresh = () =>
  useMutation({
    mutationFn: (body: RefreshTokenInput) => authService.refresh(body),
    onSuccess: (data) => setAccessToken(data.accessToken),
  })

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (body: ForgotPasswordInput) => authService.forgotPassword(body),
  })

export const useResetPassword = () =>
  useMutation({
    mutationFn: (body: ResetPasswordInput) => authService.resetPassword(body),
  })

export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RefreshTokenInput) => authService.logout(body),
    onSuccess: () => {
      setAccessToken(null)
      queryClient.removeQueries({ queryKey: authKeys.all })
    },
  })
}

