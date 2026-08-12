// keys/tickets.keys.ts — query keys tickets (généré api-forge).

export const ticketsKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketsKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...ticketsKeys.lists(), params ?? {}] as const,
  details: () => [...ticketsKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketsKeys.details(), id] as const,
}

