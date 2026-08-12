// services/technicians.service.ts — appels API technicians (généré api-forge).

import * as v from 'valibot'
import { http } from '@/services/http/axios'
import { createTechnicianSchema } from '@/schema/technician.schema'
import type { CreateTechnicianInput } from '@/schema/technician.schema'
import { updateAvailabilitySchema } from '@/schema/technician.schema'
import type { UpdateAvailabilityInput } from '@/schema/technician.schema'
import { updateTechnicianSchema } from '@/schema/technician.schema'
import type { UpdateTechnicianInput } from '@/schema/technician.schema'
import { setTechnicianSkillsSchema } from '@/schema/technician.schema'
import type { SetTechnicianSkillsInput } from '@/schema/technician.schema'
import type { Paginated } from '@/types/common'
import type { Technician } from '@/types/technician'

export const techniciansService = {
  list: (params?: { page?: number; limit?: number; isAvailable?: string; skillId?: string; isActive?: string }): Promise<Paginated<Technician>> => {
    return http.get<Paginated<Technician>>('/technicians', { params }).then((r) => r.data)
  },

  create: (body: CreateTechnicianInput): Promise<Technician> => {
    return http.post<Technician>('/technicians', v.parse(createTechnicianSchema, body)).then((r) => r.data)
  },

  updateMyAvailability: (body: UpdateAvailabilityInput): Promise<Technician> => {
    return http.patch<Technician>('/technicians/me/availability', v.parse(updateAvailabilitySchema, body)).then((r) => r.data)
  },

  getById: (id: string): Promise<Technician> => {
    return http.get<Technician>(`/technicians/${id}`).then((r) => r.data)
  },

  update: (id: string, body: UpdateTechnicianInput): Promise<Technician> => {
    return http.patch<Technician>(`/technicians/${id}`, v.parse(updateTechnicianSchema, body)).then((r) => r.data)
  },

  setSkills: (id: string, body: SetTechnicianSkillsInput): Promise<Technician> => {
    return http.put<Technician>(`/technicians/${id}/skills`, v.parse(setTechnicianSkillsSchema, body)).then((r) => r.data)
  }
}

