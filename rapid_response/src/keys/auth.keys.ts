// keys/auth.keys.ts — query keys auth (généré api-forge).

export const authKeys = {
  all: ['auth'] as const,
  lists: () => [...authKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...authKeys.lists(), params ?? {}] as const,
  details: () => [...authKeys.all, 'detail'] as const,
  detail: (id: string) => [...authKeys.details(), id] as const,
}

