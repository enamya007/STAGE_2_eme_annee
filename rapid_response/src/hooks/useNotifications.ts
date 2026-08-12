'use client'

// hooks/useNotifications.ts — hooks TanStack Query notifications (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications.service'
import { notificationsKeys } from '@/keys/notifications.keys'
import type { PaginationQuery } from '@/types/common'

export const useNotifications = (params?: PaginationQuery) =>
  useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => notificationsService.list(params),
  })

export const useUnreadCount = () =>
  useQuery({
    queryKey: [...notificationsKeys.all, 'unread-count'] as const,
    queryFn: () => notificationsService.unreadCount(),
  })

export const useReadAllNotifications = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsService.readAll(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
  })
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
  })
}

