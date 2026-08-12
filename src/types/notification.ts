// types/notification.ts — modèles notifications (généré api-forge).

import type { NotificationType } from '@/types/enums'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string
  payload: Record<string, unknown> | null
  ticketId: string | null
  ticketReference: string | null
  readAt: string | null
  createdAt: string
}

export type UnreadCount = {
  count: number
}

