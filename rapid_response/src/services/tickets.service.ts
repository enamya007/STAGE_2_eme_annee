// services/tickets.service.ts — appels API tickets (généré api-forge).

import * as v from 'valibot'
import { http } from '@/services/http/axios'
import { createTicketSchema } from '@/schema/ticket.schema'
import type { CreateTicketInput } from '@/schema/ticket.schema'
import { updateTicketSchema } from '@/schema/ticket.schema'
import type { UpdateTicketInput } from '@/schema/ticket.schema'
import { resolveTicketSchema } from '@/schema/ticket.schema'
import type { ResolveTicketInput } from '@/schema/ticket.schema'
import { reasonSchema } from '@/schema/ticket.schema'
import type { ReasonInput } from '@/schema/ticket.schema'
import { assignTicketSchema } from '@/schema/ticket.schema'
import type { AssignTicketInput } from '@/schema/ticket.schema'
import { createCommentSchema } from '@/schema/ticket.schema'
import type { CreateCommentInput } from '@/schema/ticket.schema'
import type { Paginated } from '@/types/common'
import type { Comment } from '@/types/comment'
import type {
  Ticket,
  TicketAssignment,
  TicketListItem,
  TechnicianSuggestion,
} from '@/types/ticket'

export const ticketsService = {
  list: (params?: { page?: number; limit?: number; status?: string; priority?: string; categoryId?: string; assigneeId?: string; createdById?: string; q?: string; sort?: string; order?: string }): Promise<Paginated<TicketListItem>> => {
    return http.get<Paginated<TicketListItem>>('/tickets', { params }).then((r) => r.data)
  },

  create: (body: CreateTicketInput): Promise<Ticket> => {
    return http.post<Ticket>('/tickets', v.parse(createTicketSchema, body)).then((r) => r.data)
  },

  getById: (id: string): Promise<Ticket> => {
    return http.get<Ticket>(`/tickets/${id}`).then((r) => r.data)
  },

  update: (id: string, body: UpdateTicketInput): Promise<Ticket> => {
    return http.patch<Ticket>(`/tickets/${id}`, v.parse(updateTicketSchema, body)).then((r) => r.data)
  },

  remove: (id: string): Promise<void> => {
    return http.delete(`/tickets/${id}`).then(() => undefined)
  },

  start: (id: string): Promise<Ticket> => {
    return http.post<Ticket>(`/tickets/${id}/start`).then((r) => r.data)
  },

  resolve: (id: string, body: ResolveTicketInput): Promise<Ticket> => {
    return http.post<Ticket>(`/tickets/${id}/resolve`, v.parse(resolveTicketSchema, body)).then((r) => r.data)
  },

  reopen: (id: string, body: ReasonInput): Promise<Ticket> => {
    return http.post<Ticket>(`/tickets/${id}/reopen`, v.parse(reasonSchema, body)).then((r) => r.data)
  },

  close: (id: string): Promise<Ticket> => {
    return http.post<Ticket>(`/tickets/${id}/close`).then((r) => r.data)
  },

  cancel: (id: string, body: ReasonInput): Promise<Ticket> => {
    return http.post<Ticket>(`/tickets/${id}/cancel`, v.parse(reasonSchema, body)).then((r) => r.data)
  },

  getAssignmentSuggestions: (id: string, params?: { limit?: number }): Promise<TechnicianSuggestion[]> => {
    return http.get<TechnicianSuggestion[]>(`/tickets/${id}/assignment-suggestions`, { params }).then((r) => r.data)
  },

  assign: (id: string, body: AssignTicketInput): Promise<Ticket> => {
    return http.post<Ticket>(`/tickets/${id}/assign`, v.parse(assignTicketSchema, body)).then((r) => r.data)
  },

  getAssignmentHistory: (id: string): Promise<TicketAssignment[]> => {
    return http.get<TicketAssignment[]>(`/tickets/${id}/assignments`).then((r) => r.data)
  },

  listComments: (id: string, params?: { page?: number; limit?: number }): Promise<Paginated<Comment>> => {
    return http.get<Paginated<Comment>>(`/tickets/${id}/comments`, { params }).then((r) => r.data)
  },

  createComment: (id: string, body: CreateCommentInput): Promise<Comment> => {
    return http.post<Comment>(`/tickets/${id}/comments`, v.parse(createCommentSchema, body)).then((r) => r.data)
  }
}

