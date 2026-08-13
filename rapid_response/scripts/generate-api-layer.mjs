/**
 * api-forge code generator — Ticket Checker → rapid_response
 * Lit manifest.json et écrit services/types/schema/keys/hooks.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const OUT = resolve(process.argv[2] ?? '.')
const manifest = JSON.parse(
  readFileSync(resolve(OUT, 'manifest.json'), 'utf8'),
)

const LABELS = {
  username: 'nom d’utilisateur',
  email: 'adresse e-mail',
  password: 'mot de passe',
  identifier: 'identifiant',
  firstName: 'prénom',
  lastName: 'nom',
  phone: 'téléphone',
  title: 'titre',
  description: 'description',
  priority: 'priorité',
  categoryId: 'catégorie',
  siteLabel: 'libellé du site',
  siteAddress: 'adresse du site',
  refreshToken: 'refresh token',
  token: 'jeton',
  newPassword: 'nouveau mot de passe',
  body: 'contenu',
  visibility: 'visibilité',
  resolutionNote: 'note de résolution',
  reason: 'motif',
  technicianId: 'technicien',
  isAutoSuggested: 'suggestion automatique',
  isAvailable: 'disponibilité',
  maxConcurrentTickets: 'charge max',
  isActive: 'statut actif',
  skills: 'compétences',
  skillId: 'compétence',
  level: 'niveau',
  name: 'nom',
  file: 'fichier',
}

function label(name) {
  return LABELS[name] ?? name
}

function articleRequis(name) {
  const l = label(name)
  const fem = /^(adresse|visibilité|disponibilité|priorité|catégorie|compétence|note)/i.test(
    l,
  )
  return fem ? `La ${l} est requise` : `Le ${l} est requis`
}

/** Response DTO → friendly type name */
function typeName(ref) {
  if (!ref) return 'unknown'
  const map = {
    UserResponseDto: 'User',
    AuthResponseDto: 'AuthResponse',
    TicketResponseDto: 'Ticket',
    TicketListItemDto: 'TicketListItem',
    TechnicianResponseDto: 'Technician',
    CommentResponseDto: 'Comment',
    AttachmentResponseDto: 'Attachment',
    SkillResponseDto: 'Skill',
    NotificationResponseDto: 'Notification',
    UnreadCountResponseDto: 'UnreadCount',
    PaginationMetaDto: 'PaginationMeta',
    PaginatedResponseDto: 'Paginated',
    TicketCategorySummaryDto: 'TicketCategorySummary',
    TicketListCategorySummaryDto: 'TicketListCategorySummary',
    TicketListAssigneeSummaryDto: 'TicketListAssigneeSummary',
    UserSummaryDto: 'UserSummary',
    TechnicianSuggestionDto: 'TechnicianSuggestion',
    TicketAssignmentResponseDto: 'TicketAssignment',
    AssignmentActorSummaryDto: 'AssignmentActorSummary',
    TechnicianSkillResponseDto: 'TechnicianSkill',
    TechnicianSkillInputDto: 'TechnicianSkillInput',
  }
  return map[ref] ?? ref.replace(/Dto$/, '')
}

function methodName(operationId) {
  if (operationId.startsWith('TicketCommentsController_')) {
    const base = operationId.slice('TicketCommentsController_'.length)
    if (base === 'list') return 'listComments'
    if (base === 'create') return 'createComment'
    return base
  }
  const m = operationId.match(/^[A-Za-z]+Controller_(.+)$/)
  return m ? m[1] : operationId
}

function tsType(node, { forResponse = true } = {}) {
  if (!node) return 'unknown'
  switch (node.kind) {
    case 'string':
      return 'string'
    case 'number':
    case 'integer':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'enum':
      return node.enum.map((v) => `'${v}'`).join(' | ')
    case 'ref':
      return typeName(node.ref)
    case 'array':
      return `${tsType(node.items, { forResponse })}[]`
    case 'record':
      return `Record<string, ${tsType(node.values, { forResponse })}>`
    case 'unknown':
      return 'unknown'
    case 'object': {
      if (!node.properties || Object.keys(node.properties).length === 0) {
        return 'Record<string, unknown>'
      }
      const lines = Object.entries(node.properties).map(([k, v]) => {
        const opt = v.required === false ? '?' : ''
        const nullish = v.nullable ? ' | null' : ''
        return `  ${k}${opt}: ${tsType(v, { forResponse })}${nullish}`
      })
      return `{\n${lines.join('\n')}\n}`
    }
    case 'union':
      return (node.anyOf ?? []).map((n) => tsType(n, { forResponse })).join(' | ')
    default:
      return 'unknown'
  }
}

function propTs(name, node) {
  const opt = node.required === false ? '?' : ''
  const nullish = node.nullable ? ' | null' : ''
  return `  ${name}${opt}: ${tsType(node)}${nullish}`
}

function valibotField(name, node) {
  const msg = articleRequis(name)
  const l = label(name)

  if (node.kind === 'ref' && manifest.schemas[node.ref]?.kind === 'enum') {
    const values = manifest.schemas[node.ref].enum
      .map((v) => `'${v}'`)
      .join(', ')
    let schema = `v.picklist([${values}] as const, 'Valeur invalide pour ${l}')`
    if (node.required === false) schema = `v.optional(${schema})`
    if (node.nullable) schema = `v.nullable(${schema})`
    return `  ${name}: ${schema}`
  }

  if (node.kind === 'enum') {
    const values = node.enum.map((v) => `'${v}'`).join(', ')
    let schema = `v.picklist([${values}] as const, 'Valeur invalide pour ${l}')`
    if (node.required === false) schema = `v.optional(${schema})`
    if (node.nullable) schema = `v.nullable(${schema})`
    return `  ${name}: ${schema}`
  }

  if (node.kind === 'boolean') {
    let schema = `v.boolean('${msg.replace('est requis', 'est invalide').replace('est requise', 'est invalide')}')`
    if (node.required === false) schema = `v.optional(${schema})`
    return `  ${name}: ${schema}`
  }

  if (node.kind === 'number' || node.kind === 'integer') {
    const pipes = [`v.number('${msg.replace(/requis[e]?/, 'invalide')}')`]
    if (node.kind === 'integer') pipes.push(`v.integer('Le ${l} doit être un entier')`)
    if (node.constraints?.minimum != null)
      pipes.push(
        `v.minValue(${node.constraints.minimum}, 'Le ${l} doit être ≥ ${node.constraints.minimum}')`,
      )
    if (node.constraints?.maximum != null)
      pipes.push(
        `v.maxValue(${node.constraints.maximum}, 'Le ${l} doit être ≤ ${node.constraints.maximum}')`,
      )
    let schema = pipes.length === 1 ? pipes[0] : `v.pipe(${pipes.join(', ')})`
    if (node.required === false) schema = `v.optional(${schema})`
    return `  ${name}: ${schema}`
  }

  if (node.kind === 'array') {
    let item = 'v.unknown()'
    if (node.items?.kind === 'ref') {
      const schemaFn = `${camel(typeName(node.items.ref))}Schema`
      item = schemaFn
    }
    let schema = `v.array(${item}, '${msg}')`
    if (node.required === false) schema = `v.optional(${schema})`
    return `  ${name}: ${schema}`
  }

  if (node.kind === 'string') {
    const pipes = [`v.string('${msg}')`, `v.nonEmpty('${msg}')`]
    if (node.format === 'email') pipes.push(`v.email('Adresse email invalide')`)
    if (node.format === 'uuid') pipes.push(`v.uuid('Identifiant invalide')`)
    if (node.format === 'uri' || node.format === 'url')
      pipes.push(`v.url('URL invalide')`)
    if (node.constraints?.minLength != null)
      pipes.push(
        `v.minLength(${node.constraints.minLength}, 'Le ${l} doit contenir au moins ${node.constraints.minLength} caractères')`,
      )
    if (node.constraints?.maxLength != null)
      pipes.push(
        `v.maxLength(${node.constraints.maxLength}, 'Le ${l} ne doit pas dépasser ${node.constraints.maxLength} caractères')`,
      )
    let schema = `v.pipe(${pipes.join(', ')})`
    if (node.required === false) {
      // optional strings: don't force nonEmpty when absent
      const optPipes = [`v.string('Le ${l} est invalide')`]
      if (node.format === 'email') optPipes.push(`v.email('Adresse email invalide')`)
      if (node.format === 'uuid') optPipes.push(`v.uuid('Identifiant invalide')`)
      if (node.constraints?.minLength != null)
        optPipes.push(
          `v.minLength(${node.constraints.minLength}, 'Le ${l} doit contenir au moins ${node.constraints.minLength} caractères')`,
        )
      if (node.constraints?.maxLength != null)
        optPipes.push(
          `v.maxLength(${node.constraints.maxLength}, 'Le ${l} ne doit pas dépasser ${node.constraints.maxLength} caractères')`,
        )
      schema = `v.optional(${optPipes.length === 1 ? optPipes[0] : `v.pipe(${optPipes.join(', ')})`})`
    }
    if (node.nullable) schema = `v.nullable(${schema})`
    return `  ${name}: ${schema}`
  }

  let schema = 'v.unknown()'
  if (node.required === false) schema = `v.optional(${schema})`
  return `  ${name}: ${schema}`
}

function camel(name) {
  return name.charAt(0).toLowerCase() + name.slice(1)
}

function pascal(name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function kebabToCamel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function write(rel, content) {
  const full = join(OUT, 'src', rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content.trimStart().replace(/^\n/, '') + '\n', 'utf8')
  console.log('+', rel)
}

// ——— shared types ———
const enumExports = []
for (const [name, schema] of Object.entries(manifest.schemas)) {
  if (schema.kind === 'enum') {
    enumExports.push(
      `export type ${name} = ${schema.enum.map((v) => `'${v}'`).join(' | ')}`,
    )
  }
}

write(
  'types/enums.ts',
  `// types/enums.ts — unions d'enums API (généré api-forge).

${enumExports.join('\n')}
`,
)

write(
  'types/common.ts',
  `// types/common.ts — pagination partagée (généré api-forge).

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type Paginated<T> = {
  data: T[]
  meta: PaginationMeta
}

export type PaginationQuery = {
  page?: number
  limit?: number
}
`,
)

// Build type files for response DTOs + shared summaries
const RESPONSE_SCHEMAS = [
  'UserResponseDto',
  'AuthResponseDto',
  'UserSummaryDto',
  'TicketCategorySummaryDto',
  'TicketListCategorySummaryDto',
  'TicketListAssigneeSummaryDto',
  'TicketListItemDto',
  'TicketResponseDto',
  'CommentAuthorDto',
  'CommentResponseDto',
  'TechnicianSkillResponseDto',
  'TechnicianResponseDto',
  'TechnicianSuggestionDto',
  'AssignmentActorSummaryDto',
  'TicketAssignmentResponseDto',
  'AttachmentResponseDto',
  'SkillResponseDto',
  'NotificationResponseDto',
  'UnreadCountResponseDto',
]

function emitObjectType(schemaName) {
  const schema = manifest.schemas[schemaName]
  const name = typeName(schemaName)
  const props = Object.entries(schema.properties)
    .map(([k, v]) => propTs(k, v))
    .join('\n')
  return `export type ${name} = {\n${props}\n}`
}

write(
  'types/user.ts',
  `// types/user.ts — modèles utilisateur (généré api-forge).

import type { UserRole } from '@/types/enums'

${emitObjectType('UserResponseDto').replace('role: UserRole', 'role: UserRole')}
${emitObjectType('UserSummaryDto')}
${emitObjectType('AuthResponseDto')}
`,
)

// Fix user.ts - User type uses UserRole ref which tsType already maps
write(
  'types/user.ts',
  `// types/user.ts — modèles utilisateur (généré api-forge).

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
`,
)

write(
  'types/ticket.ts',
  `// types/ticket.ts — modèles tickets (généré api-forge).

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

export type CommentAuthor = {
  id: string
  username: string
}

export type Comment = {
  id: string
  body: string
  visibility: import('@/types/enums').CommentVisibility
  author: CommentAuthor | null
  createdAt: string
}
`,
)

// Check CommentResponseDto for all fields
const commentSchema = manifest.schemas.CommentResponseDto
console.log('Comment fields', Object.keys(commentSchema.properties))

write(
  'types/technician.ts',
  `// types/technician.ts — modèles techniciens (généré api-forge).

export type TechnicianSkill = {
  skillId: string
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
`,
)

write(
  'types/attachment.ts',
  `// types/attachment.ts — modèles pièces jointes (généré api-forge).

export type Attachment = {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  downloadUrl: string | null
}
`,
)

write(
  'types/skill.ts',
  `// types/skill.ts — modèles compétences (généré api-forge).

export type Skill = {
  id: string
  name: string
  description: string | null
}
`,
)

write(
  'types/notification.ts',
  `// types/notification.ts — modèles notifications (généré api-forge).

import type { NotificationType } from '@/types/enums'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string
  payload: Record<string, unknown> | null
  ticketId: string | null
  ticketReference: string | null
  readAt: string | null
  createdAt: string
}

export type UnreadCount = {
  count: number
}
`,
)

// Fix technician skill from schema
const techSkill = manifest.schemas.TechnicianSkillResponseDto
write(
  'types/technician.ts',
  `// types/technician.ts — modèles techniciens (généré api-forge).

export type TechnicianSkill = {
${Object.entries(techSkill.properties)
  .map(([k, v]) => propTs(k, v))
  .join('\n')}
}

export type Technician = {
${Object.entries(manifest.schemas.TechnicianResponseDto.properties)
  .map(([k, v]) => propTs(k, v))
  .join('\n')}
}
`,
)

// Comment type properly
write(
  'types/comment.ts',
  `// types/comment.ts — modèles commentaires (généré api-forge).

import type { CommentVisibility } from '@/types/enums'

export type CommentAuthor = {
  id: string
  username: string
}

export type Comment = {
  id: string
  body: string
  visibility: CommentVisibility
  author: CommentAuthor | null
  createdAt: string
}
`,
)

// Simplify ticket.ts without Comment
write(
  'types/ticket.ts',
  `// types/ticket.ts — modèles tickets (généré api-forge).

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
`,
)

function schemaFromDto(dtoName, exportName) {
  const schema = manifest.schemas[dtoName]
  const fields = Object.entries(schema.properties)
    .map(([k, v]) => valibotField(k, v))
    .join(',\n')

  // technician skills array needs nested schema
  let prelude = ''
  if (dtoName === 'CreateTechnicianDto' || dtoName === 'SetTechnicianSkillsDto') {
    const skillIn = manifest.schemas.TechnicianSkillInputDto
    const skillFields = Object.entries(skillIn.properties)
      .map(([k, v]) => valibotField(k, v))
      .join(',\n')
    prelude = `export const technicianSkillInputSchema = v.object({\n${skillFields}\n})\n\n`
  }

  let body = fields
  if (dtoName === 'CreateTechnicianDto' || dtoName === 'SetTechnicianSkillsDto') {
    body = fields.replace(
      /skills: v\.optional\(v\.array\(technicianSkillInputSchema/g,
      'skills: v.optional(v.array(technicianSkillInputSchema',
    )
    // fix valibotField array ref naming
    body = Object.entries(schema.properties)
      .map(([k, v]) => {
        if (k === 'skills' && v.kind === 'array') {
          const required = v.required !== false
          const inner = `v.array(technicianSkillInputSchema, '${articleRequis('skills')}')`
          return `  skills: ${required ? inner : `v.optional(${inner})`}`
        }
        return valibotField(k, v)
      })
      .join(',\n')
  }

  return `${prelude}export const ${exportName} = v.object({\n${body}\n})

export type ${pascal(exportName.replace(/Schema$/, ''))}Input = v.InferInput<typeof ${exportName}>
`
}

// ——— schemas ———
write(
  'schema/auth.schema.ts',
  `// schema/auth.schema.ts — validation entrées auth (généré api-forge).

import * as v from 'valibot'

${schemaFromDto('RegisterDto', 'registerSchema')}
${schemaFromDto('LoginDto', 'loginSchema')}
${schemaFromDto('RefreshTokenDto', 'refreshTokenSchema')}
${schemaFromDto('ForgotPasswordDto', 'forgotPasswordSchema')}
${schemaFromDto('ResetPasswordDto', 'resetPasswordSchema')}
`,
)

write(
  'schema/tickets.schema.ts',
  `// schema/ticket.schema.ts — validation entrées tickets (généré api-forge).

import * as v from 'valibot'
import type { TicketPriority } from '@/types/enums'

${schemaFromDto('CreateTicketDto', 'createTicketSchema')}
${schemaFromDto('UpdateTicketDto', 'updateTicketSchema')}
${schemaFromDto('ResolveTicketDto', 'resolveTicketSchema')}
${schemaFromDto('ReasonDto', 'reasonSchema')}
${schemaFromDto('AssignTicketDto', 'assignTicketSchema')}
${schemaFromDto('CreateCommentDto', 'createCommentSchema')}
`,
)

write(
  'schema/technicians.schema.ts',
  `// schema/technician.schema.ts — validation entrées techniciens (généré api-forge).

import * as v from 'valibot'

${schemaFromDto('TechnicianSkillInputDto', 'technicianSkillInputSchema')}
${schemaFromDto('CreateTechnicianDto', 'createTechnicianSchema')}
${schemaFromDto('UpdateTechnicianDto', 'updateTechnicianSchema')}
${schemaFromDto('UpdateAvailabilityDto', 'updateAvailabilitySchema')}
${schemaFromDto('SetTechnicianSkillsDto', 'setTechnicianSkillsSchema')}
`,
)

write(
  'schema/skills.schema.ts',
  `// schema/skill.schema.ts — validation entrées compétences (généré api-forge).

import * as v from 'valibot'

${schemaFromDto('CreateSkillDto', 'createSkillSchema')}
`,
)

// ——— http ———
write(
  'services/http/axios.ts',
  `// Instance axios partagée — générée par api-forge, éditable.

import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

/** Token JWT courant (alimenté depuis NextAuth côté client). */
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token =
    accessToken ??
    (typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null)

  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const data = error.response?.data
    const raw = data?.message
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : (raw ?? error.message ?? 'Erreur réseau')

    return Promise.reject(new Error(message))
  },
)
`,
)

function pathToTemplate(path, pathParams) {
  let out = path
  for (const p of pathParams ?? []) {
    out = out.replace(`{${p.name}}`, `\${${p.name}}`)
  }
  return out.includes('${') ? '`' + out + '`' : `'${out}'`
}

function responseType(endpoint) {
  const s = endpoint.response?.schema
  if (!s || s.kind === 'unknown') return 'void'
  if (s.kind === 'ref') return typeName(s.ref)
  if (s.kind === 'array') return `${tsType(s.items)}[]`
  if (s.kind === 'object' && s.properties?.data && s.properties?.meta) {
    const item = s.properties.data.items
    const itemType = item?.kind === 'ref' ? typeName(item.ref) : tsType(item)
    return `Paginated<${itemType}>`
  }
  if (s.kind === 'object' && s.properties?.message) {
    return `{ message?: string }`
  }
  return tsType(s)
}

function bodySchemaInfo(endpoint) {
  const body = endpoint.requestBody
  if (!body) return null
  if (body.contentType === 'multipart/form-data') {
    return { kind: 'multipart' }
  }
  if (body.schema?.kind === 'ref') {
    const ref = body.schema.ref
    const schemaMap = {
      RegisterDto: { schema: 'registerSchema', type: 'RegisterInput', from: '@/schema/auth.schema' },
      LoginDto: { schema: 'loginSchema', type: 'LoginInput', from: '@/schema/auth.schema' },
      RefreshTokenDto: {
        schema: 'refreshTokenSchema',
        type: 'RefreshTokenInput',
        from: '@/schema/auth.schema',
      },
      ForgotPasswordDto: {
        schema: 'forgotPasswordSchema',
        type: 'ForgotPasswordInput',
        from: '@/schema/auth.schema',
      },
      ResetPasswordDto: {
        schema: 'resetPasswordSchema',
        type: 'ResetPasswordInput',
        from: '@/schema/auth.schema',
      },
      CreateTicketDto: {
        schema: 'createTicketSchema',
        type: 'CreateTicketInput',
        from: '@/schema/ticket.schema',
      },
      UpdateTicketDto: {
        schema: 'updateTicketSchema',
        type: 'UpdateTicketInput',
        from: '@/schema/ticket.schema',
      },
      ResolveTicketDto: {
        schema: 'resolveTicketSchema',
        type: 'ResolveTicketInput',
        from: '@/schema/ticket.schema',
      },
      ReasonDto: { schema: 'reasonSchema', type: 'ReasonInput', from: '@/schema/ticket.schema' },
      AssignTicketDto: {
        schema: 'assignTicketSchema',
        type: 'AssignTicketInput',
        from: '@/schema/ticket.schema',
      },
      CreateCommentDto: {
        schema: 'createCommentSchema',
        type: 'CreateCommentInput',
        from: '@/schema/ticket.schema',
      },
      CreateTechnicianDto: {
        schema: 'createTechnicianSchema',
        type: 'CreateTechnicianInput',
        from: '@/schema/technician.schema',
      },
      UpdateTechnicianDto: {
        schema: 'updateTechnicianSchema',
        type: 'UpdateTechnicianInput',
        from: '@/schema/technician.schema',
      },
      UpdateAvailabilityDto: {
        schema: 'updateAvailabilitySchema',
        type: 'UpdateAvailabilityInput',
        from: '@/schema/technician.schema',
      },
      SetTechnicianSkillsDto: {
        schema: 'setTechnicianSkillsSchema',
        type: 'SetTechnicianSkillsInput',
        from: '@/schema/technician.schema',
      },
      CreateSkillDto: {
        schema: 'createSkillSchema',
        type: 'CreateSkillInput',
        from: '@/schema/skill.schema',
      },
    }
    return schemaMap[ref] ?? { kind: 'raw', ref }
  }
  return { kind: 'raw' }
}

function emitService(resource) {
  const name = resource.name
  const svc = `${kebabToCamel(name)}Service`
  const imports = new Set()
  const typeImports = new Set()
  const methods = []

  imports.add(`import * as v from 'valibot'`)
  imports.add(`import { http } from '@/services/http/axios'`)

  for (const ep of resource.endpoints) {
    const mName = methodName(ep.operationId)
    const ret = responseType(ep)
    if (ret.startsWith('Paginated<')) typeImports.add(`import type { Paginated } from '@/types/common'`)
    if (ret.includes('User') || ret === 'AuthResponse') {
      if (ret === 'AuthResponse' || ret === 'User')
        typeImports.add(`import type { ${ret} } from '@/types/user'`)
    }
    if (
      ['Ticket', 'TicketListItem', 'TechnicianSuggestion', 'TicketAssignment'].includes(ret) ||
      ret.includes('Ticket')
    ) {
      const t = ret.replace('Paginated<', '').replace('>', '')
      if (
        [
          'Ticket',
          'TicketListItem',
          'TechnicianSuggestion',
          'TicketAssignment',
        ].includes(t)
      ) {
        typeImports.add(`import type { ${t} } from '@/types/ticket'`)
      }
    }
    if (ret === 'Comment' || ret === 'Paginated<Comment>') {
      typeImports.add(`import type { Comment } from '@/types/comment'`)
    }
    if (ret === 'Technician' || ret === 'Paginated<Technician>') {
      typeImports.add(`import type { Technician } from '@/types/technician'`)
    }
    if (ret === 'Attachment' || ret.endsWith('Attachment[]')) {
      typeImports.add(`import type { Attachment } from '@/types/attachment'`)
    }
    if (ret === 'Skill' || ret === 'Skill[]') {
      typeImports.add(`import type { Skill } from '@/types/skill'`)
    }
    if (ret === 'Notification' || ret === 'Paginated<Notification>' || ret === 'UnreadCount') {
      typeImports.add(
        `import type { ${ret === 'UnreadCount' ? 'UnreadCount' : 'Notification'} } from '@/types/notification'`,
      )
    }

    const pathParams = ep.pathParams ?? []
    const queryParams = ep.queryParams ?? []
    const args = []
    for (const p of pathParams) args.push(`${p.name}: string`)

    const bodyInfo = bodySchemaInfo(ep)
    if (bodyInfo?.kind === 'multipart') {
      args.push('file: File')
    } else if (bodyInfo?.schema) {
      args.push(`body: ${bodyInfo.type}`)
      imports.add(
        `import { ${bodyInfo.schema} } from '${bodyInfo.from}'`,
      )
      imports.add(
        `import type { ${bodyInfo.type} } from '${bodyInfo.from}'`,
      )
    }

    if (queryParams.length) {
      const qFields = queryParams
        .map((q) => {
          const t = q.type.kind === 'number' ? 'number' : 'string'
          return `${q.name}?: ${t}`
        })
        .join('; ')
      args.push(`params?: { ${qFields} }`)
    }

    const url = pathToTemplate(ep.path, pathParams)
    const method = ep.method.toLowerCase()
    let call

    if (bodyInfo?.kind === 'multipart') {
      call = `const formData = new FormData()
    formData.append('file', file)
    return http.post<${ret}>(${url}, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)`
    } else if (bodyInfo?.schema) {
      const parsed = `v.parse(${bodyInfo.schema}, body)`
      if (method === 'post') {
        call = `return http.post<${ret}>(${url}, ${parsed}).then((r) => r.data)`
      } else if (method === 'patch') {
        call = `return http.patch<${ret}>(${url}, ${parsed}).then((r) => r.data)`
      } else if (method === 'put') {
        call = `return http.put<${ret}>(${url}, ${parsed}).then((r) => r.data)`
      } else {
        call = `return http.${method}<${ret}>(${url}, ${parsed}).then((r) => r.data)`
      }
    } else if (method === 'get') {
      call = queryParams.length
        ? `return http.get<${ret}>(${url}, { params }).then((r) => r.data)`
        : `return http.get<${ret}>(${url}).then((r) => r.data)`
    } else if (method === 'delete') {
      call = `return http.delete<${ret}>(${url}).then((r) => r.data)`
    } else if (method === 'post') {
      call = `return http.post<${ret}>(${url}).then((r) => r.data)`
    } else if (method === 'patch') {
      call = `return http.patch<${ret}>(${url}).then((r) => r.data)`
    } else {
      call = `return http.${method}<${ret}>(${url}).then((r) => r.data)`
    }

    // void responses (204)
    if (ret === 'void') {
      call = call.replace(`<void>`, '').replace('.then((r) => r.data)', '.then(() => undefined)')
    }

    methods.push(`  ${mName}: (${args.join(', ')}): Promise<${ret}> => {
    ${call}
  }`)
  }

  // dedupe imports
  const importLines = [...imports]
  const typeLines = [...typeImports]

  return `// services/${name}.service.ts — appels API ${name} (généré api-forge).

${[...new Set([...importLines, ...typeLines])].join('\n')}

export const ${svc} = {
${methods.join(',\n\n')}
}
`
}

for (const resource of manifest.resources) {
  write(`services/${resource.name}.service.ts`, emitService(resource))
}

// ——— keys ———
write(
  'keys/index.ts',
  `// keys/index.ts — point d'entrée des query keys (généré api-forge).

export { authKeys } from '@/keys/auth.keys'
export { ticketsKeys } from '@/keys/tickets.keys'
export { techniciansKeys } from '@/keys/technicians.keys'
export { attachmentsKeys } from '@/keys/attachments.keys'
export { skillsKeys } from '@/keys/skills.keys'
export { notificationsKeys } from '@/keys/notifications.keys'
`,
)

for (const resource of manifest.resources) {
  const key = `${kebabToCamel(resource.name)}Keys`
  write(
    `keys/${resource.name}.keys.ts`,
    `// keys/${resource.name}.keys.ts — query keys ${resource.name} (généré api-forge).

export const ${key} = {
  all: ['${resource.name}'] as const,
  lists: () => [...${key}.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...${key}.lists(), params ?? {}] as const,
  details: () => [...${key}.all, 'detail'] as const,
  detail: (id: string) => [...${key}.details(), id] as const,
}
`,
  )
}

// ——— hooks (hand-crafted per resource for correct signatures) ———
write(
  'hooks/useAuth.ts',
  `'use client'

// hooks/useAuth.ts — hooks TanStack Query auth (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { authKeys } from '@/keys/auth.keys'
import { setAccessToken } from '@/services/http/axios'
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@/schema/auth.schema'

export const useMe = () =>
  useQuery({
    queryKey: authKeys.detail('me'),
    queryFn: () => authService.me(),
  })

export const useRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RegisterInput) => authService.register(body),
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      queryClient.setQueryData(authKeys.detail('me'), data.user)
    },
  })
}

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: LoginInput) => authService.login(body),
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      queryClient.setQueryData(authKeys.detail('me'), data.user)
    },
  })
}

export const useRefresh = () =>
  useMutation({
    mutationFn: (body: RefreshTokenInput) => authService.refresh(body),
    onSuccess: (data) => setAccessToken(data.accessToken),
  })

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (body: ForgotPasswordInput) => authService.forgotPassword(body),
  })

export const useResetPassword = () =>
  useMutation({
    mutationFn: (body: ResetPasswordInput) => authService.resetPassword(body),
  })

export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RefreshTokenInput) => authService.logout(body),
    onSuccess: () => {
      setAccessToken(null)
      queryClient.removeQueries({ queryKey: authKeys.all })
    },
  })
}
`,
)

write(
  'hooks/useTickets.ts',
  `'use client'

// hooks/useTickets.ts — hooks TanStack Query tickets (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketsService } from '@/services/tickets.service'
import { ticketsKeys } from '@/keys/tickets.keys'
import type {
  CreateTicketInput,
  UpdateTicketInput,
  ResolveTicketInput,
  ReasonInput,
  AssignTicketInput,
  CreateCommentInput,
} from '@/schema/ticket.schema'
import type { PaginationQuery } from '@/types/common'

export const useTickets = (params?: PaginationQuery & Record<string, unknown>) =>
  useQuery({
    queryKey: ticketsKeys.list(params),
    queryFn: () => ticketsService.list(params),
  })

export const useTicket = (id: string) =>
  useQuery({
    queryKey: ticketsKeys.detail(id),
    queryFn: () => ticketsService.getById(id),
    enabled: Boolean(id),
  })

export const useCreateTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateTicketInput) => ticketsService.create(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() }),
  })
}

export const useUpdateTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTicketInput }) =>
      ticketsService.update(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() })
    },
  })
}

export const useDeleteTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ticketsService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() }),
  })
}

export const useStartTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ticketsService.start(id),
    onSuccess: (data) => {
      queryClient.setQueryData(ticketsKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() })
    },
  })
}

export const useResolveTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ResolveTicketInput }) =>
      ticketsService.resolve(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(ticketsKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() })
    },
  })
}

export const useReopenTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReasonInput }) =>
      ticketsService.reopen(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(ticketsKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() })
    },
  })
}

export const useCloseTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ticketsService.close(id),
    onSuccess: (data) => {
      queryClient.setQueryData(ticketsKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() })
    },
  })
}

export const useCancelTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReasonInput }) =>
      ticketsService.cancel(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(ticketsKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() })
    },
  })
}

export const useAssignmentSuggestions = (id: string) =>
  useQuery({
    queryKey: [...ticketsKeys.detail(id), 'suggestions'] as const,
    queryFn: () => ticketsService.getAssignmentSuggestions(id),
    enabled: Boolean(id),
  })

export const useAssignTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AssignTicketInput }) =>
      ticketsService.assign(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(ticketsKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() })
    },
  })
}

export const useAssignmentHistory = (id: string) =>
  useQuery({
    queryKey: [...ticketsKeys.detail(id), 'assignments'] as const,
    queryFn: () => ticketsService.getAssignmentHistory(id),
    enabled: Boolean(id),
  })

export const useTicketComments = (id: string, params?: PaginationQuery) =>
  useQuery({
    queryKey: [...ticketsKeys.detail(id), 'comments', params ?? {}] as const,
    queryFn: () => ticketsService.listComments(id, params),
    enabled: Boolean(id),
  })

export const useCreateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateCommentInput }) =>
      ticketsService.createComment(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [...ticketsKeys.detail(id), 'comments'],
      })
    },
  })
}
`,
)

write(
  'hooks/useTechnicians.ts',
  `'use client'

// hooks/useTechnicians.ts — hooks TanStack Query techniciens (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { techniciansService } from '@/services/technicians.service'
import { techniciansKeys } from '@/keys/technicians.keys'
import type {
  CreateTechnicianInput,
  UpdateTechnicianInput,
  UpdateAvailabilityInput,
  SetTechnicianSkillsInput,
} from '@/schema/technician.schema'
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
`,
)

write(
  'hooks/useAttachments.ts',
  `'use client'

// hooks/useAttachments.ts — hooks TanStack Query pièces jointes (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attachmentsService } from '@/services/attachments.service'
import { attachmentsKeys } from '@/keys/attachments.keys'

export const useAttachments = (ticketId: string) =>
  useQuery({
    queryKey: attachmentsKeys.detail(ticketId),
    queryFn: () => attachmentsService.list(ticketId),
    enabled: Boolean(ticketId),
  })

export const useUploadAttachment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      attachmentsService.upload(id, file),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: attachmentsKeys.detail(id) })
    },
  })
}

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, attId }: { id: string; attId: string }) =>
      attachmentsService.remove(id, attId),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: attachmentsKeys.detail(id) })
    },
  })
}
`,
)

write(
  'hooks/useSkills.ts',
  `'use client'

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
`,
)

write(
  'hooks/useNotifications.ts',
  `'use client'

// hooks/useNotifications.ts — hooks TanStack Query notifications (généré api-forge).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications.service'
import { notificationsKeys } from '@/keys/notifications.keys'
import type { PaginationQuery } from '@/types/common'

export const useNotifications = (params?: PaginationQuery) =>
  useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => notificationsService.list(params),
  })

export const useUnreadCount = () =>
  useQuery({
    queryKey: [...notificationsKeys.all, 'unread-count'] as const,
    queryFn: () => notificationsService.unreadCount(),
  })

export const useReadAllNotifications = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsService.readAll(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
  })
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
  })
}
`,
)

// Update env.ts
write(
  'config/env.ts',
  `export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
} as const
`,
)

console.log('\\nDone →', OUT)
