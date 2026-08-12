// types/user.ts — modèles utilisateur (généré api-forge).

import type { UserRole } from '@/types/enums'

export type User = {
  id: string
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
}

export type UserSummary = {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  user: User
}

