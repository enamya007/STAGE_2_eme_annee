// types/technician.ts — modèles techniciens (généré api-forge).

export type TechnicianSkill = {
  id: string
  name: string
  level: number
}

export type Technician = {
  id: string
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  isActive: boolean
  isAvailable: boolean
  maxConcurrentTickets: number
  currentLoad: number
  skills: TechnicianSkill[]
}

