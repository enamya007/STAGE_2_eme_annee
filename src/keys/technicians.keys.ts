// keys/technicians.keys.ts — query keys technicians (généré api-forge).

export const techniciansKeys = {
  all: ['technicians'] as const,
  lists: () => [...techniciansKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...techniciansKeys.lists(), params ?? {}] as const,
  details: () => [...techniciansKeys.all, 'detail'] as const,
  detail: (id: string) => [...techniciansKeys.details(), id] as const,
}

