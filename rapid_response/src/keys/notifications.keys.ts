// keys/notifications.keys.ts — query keys notifications (généré api-forge).

export const notificationsKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationsKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...notificationsKeys.lists(), params ?? {}] as const,
  details: () => [...notificationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationsKeys.details(), id] as const,
}

