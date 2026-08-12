// services/notifications.service.ts — appels API notifications (généré api-forge).

import { http } from '@/services/http/axios'
import type { Paginated } from '@/types/common'
import type { Notification, UnreadCount } from '@/types/notification'

export const notificationsService = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: string }): Promise<Paginated<Notification>> => {
    return http.get<Paginated<Notification>>('/notifications', { params }).then((r) => r.data)
  },

  unreadCount: (): Promise<UnreadCount> => {
    return http.get<UnreadCount>('/notifications/unread-count').then((r) => r.data)
  },

  readAll: (): Promise<void> => {
    return http.patch('/notifications/read-all').then(() => undefined)
  },

  markRead: (id: string): Promise<void> => {
    return http.patch(`/notifications/${id}/read`).then(() => undefined)
  }
}

