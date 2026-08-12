// types/enums.ts — unions d'enums API (généré api-forge).

export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED'
export type CommentVisibility = 'PUBLIC' | 'INTERNAL'
export type NotificationType = 'TICKET_CREATED' | 'TICKET_ASSIGNED' | 'TICKET_STATUS_CHANGED' | 'TICKET_COMMENTED' | 'TICKET_SLA_BREACHED'

