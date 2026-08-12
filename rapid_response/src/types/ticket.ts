// types/ticket.ts — modèles tickets (généré api-forge).

import type { TicketPriority, TicketStatus } from '@/types/enums'
import type { UserSummary } from '@/types/user'

export type TicketCategorySummary = {
  id: string
  name: string
}

export type TicketListCategorySummary = {
  id: string
  name: string
}

export type TicketListAssigneeSummary = {
  id: string
  username: string
}

export type TicketListItem = {
  id: string
  reference: string
  title: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketListCategorySummary
  assignee: TicketListAssigneeSummary | null
  slaDueAt: string | null
  createdAt: string
}

export type Ticket = {
  id: string
  reference: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategorySummary
  createdBy: UserSummary
  assignee: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
  } | null
  siteLabel: string | null
  siteAddress: string | null
  slaDueAt: string | null
  assignedAt: string | null
  startedAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  cancelledAt: string | null
  resolutionNote: string | null
  createdAt: string
  updatedAt: string
}

export type TechnicianSuggestion = {
  technicianId: string
  username: string
  firstName: string | null
  lastName: string | null
  skillLevel: number | null
  currentLoad: number
  maxConcurrentTickets: number
}

export type AssignmentActorSummary = {
  id: string
  username: string
}

export type TicketAssignment = {
  id: string
  technician: AssignmentActorSummary
  assignedBy: AssignmentActorSummary | null
  reason: string | null
  isAutoSuggested: boolean
  assignedAt: string
  unassignedAt: string | null
}

