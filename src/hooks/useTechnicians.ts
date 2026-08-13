'use client'

// hooks/useTechnicians.ts — hooks TanStack Query techniciens (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { techniciansService } from '@/services/technicians.service'
import { techniciansKeys } from '@/keys/technicians.keys'
import type {
  CreateTechnicianInput,
  UpdateTechnicianInput,
  UpdateAvailabilityInput,
  SetTechnicianSkillsInput,
} from '@/schema/technicians.schema'
import type { PaginationQuery } from '@/types/common'

export const useTechnicians = (params?: PaginationQuery & Record<string, unknown>) =>
  useQuery({
    queryKey: techniciansKeys.list(params),
    queryFn: () => techniciansService.list(params),
  })

export const useTechnician = (id: string) =>
  useQuery({
    queryKey: techniciansKeys.detail(id),
    queryFn: () => techniciansService.getById(id),
    enabled: Boolean(id),
  })

export const useCreateTechnician = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateTechnicianInput) => techniciansService.create(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: techniciansKeys.lists() }),
  })
}

export const useUpdateTechnician = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTechnicianInput }) =>
      techniciansService.update(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: techniciansKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: techniciansKeys.lists() })
    },
  })
}

export const useUpdateMyAvailability = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdateAvailabilityInput) =>
      techniciansService.updateMyAvailability(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: techniciansKeys.all }),
  })
}

export const useSetTechnicianSkills = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SetTechnicianSkillsInput }) =>
      techniciansService.setSkills(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: techniciansKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: techniciansKeys.lists() })
    },
  })
}

