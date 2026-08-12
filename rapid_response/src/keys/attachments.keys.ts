// keys/attachments.keys.ts — query keys attachments (généré api-forge).

export const attachmentsKeys = {
  all: ['attachments'] as const,
  lists: () => [...attachmentsKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...attachmentsKeys.lists(), params ?? {}] as const,
  details: () => [...attachmentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...attachmentsKeys.details(), id] as const,
}

