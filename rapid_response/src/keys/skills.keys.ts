// keys/skills.keys.ts — query keys skills (généré api-forge).

export const skillsKeys = {
  all: ['skills'] as const,
  lists: () => [...skillsKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...skillsKeys.lists(), params ?? {}] as const,
  details: () => [...skillsKeys.all, 'detail'] as const,
  detail: (id: string) => [...skillsKeys.details(), id] as const,
}

