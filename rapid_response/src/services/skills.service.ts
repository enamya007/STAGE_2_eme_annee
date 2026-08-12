// services/skills.service.ts — appels API skills (généré api-forge).

import * as v from 'valibot'
import { http } from '@/services/http/axios'
import { createSkillSchema } from '@/schema/skill.schema'
import type { CreateSkillInput } from '@/schema/skill.schema'
import type { Skill } from '@/types/skill'

export const skillsService = {
  findAll: (): Promise<Skill[]> => {
    return http.get<Skill[]>('/skills').then((r) => r.data)
  },

  create: (body: CreateSkillInput): Promise<Skill> => {
    return http.post<Skill>('/skills', v.parse(createSkillSchema, body)).then((r) => r.data)
  }
}

