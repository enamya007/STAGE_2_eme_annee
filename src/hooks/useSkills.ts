'use client'

// hooks/useSkills.ts — hooks TanStack Query compétences (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { skillsService } from '@/services/skills.service'
import { skillsKeys } from '@/keys/skills.keys'
import type { CreateSkillInput } from '@/schema/skill.schema'

export const useSkills = () =>
  useQuery({
    queryKey: skillsKeys.lists(),
    queryFn: () => skillsService.findAll(),
  })

export const useCreateSkill = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateSkillInput) => skillsService.create(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: skillsKeys.lists() }),
  })
}

