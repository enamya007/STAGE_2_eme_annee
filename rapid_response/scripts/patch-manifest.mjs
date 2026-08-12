import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const raw = JSON.parse(readFileSync(resolve(root, 'openapi.raw.json'), 'utf8'))
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))

const enums = {
  UserRole: ['ADMIN', 'TECHNICIAN', 'CLIENT'],
  TicketPriority: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
  TicketStatus: [
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'CANCELLED',
  ],
  CommentVisibility: ['PUBLIC', 'INTERNAL'],
  NotificationType: [
    'TICKET_CREATED',
    'TICKET_ASSIGNED',
    'TICKET_STATUS_CHANGED',
    'TICKET_COMMENTED',
    'TICKET_SLA_BREACHED',
  ],
}

for (const [name, values] of Object.entries(enums)) {
  manifest.schemas[name] = {
    kind: 'enum',
    enum: values,
    baseType: 'string',
    nullable: false,
  }
}

function refName(ref) {
  return ref.replace('#/components/schemas/', '')
}

function patchSchemaFromRaw(schemaName) {
  const rawSchema = raw.components.schemas[schemaName]
  const target = manifest.schemas[schemaName]
  if (!rawSchema?.properties || !target?.properties) return

  for (const [prop, def] of Object.entries(rawSchema.properties)) {
    const required = (rawSchema.required ?? []).includes(prop)
    if (def.$ref) {
      const ref = refName(def.$ref)
      target.properties[prop] = {
        kind: 'ref',
        ref,
        required,
        nullable: def.nullable === true,
      }
      continue
    }
    if (Array.isArray(def.allOf)) {
      const refPart = def.allOf.find((x) => x.$ref)
      if (refPart) {
        target.properties[prop] = {
          kind: 'ref',
          ref: refName(refPart.$ref),
          required,
          nullable:
            def.nullable === true || def.allOf.some((x) => x.nullable === true),
        }
      }
    }
  }
}

for (const name of Object.keys(manifest.schemas)) {
  patchSchemaFromRaw(name)
}

for (const resource of manifest.resources) {
  for (const endpoint of resource.endpoints) {
    if (
      endpoint.response?.schema?.kind === 'object' &&
      endpoint.response.schema.properties?.data
    ) {
      endpoint.response.schema.properties.data.required = true
    }
    if (endpoint.path.startsWith('/api')) {
      endpoint.path = endpoint.path.slice(4) || '/'
    }
  }
}

manifest.resources = manifest.resources.filter((r) => r.name !== 'app')
manifest.stats.resources = manifest.resources.length
manifest.stats.endpoints = manifest.resources.reduce(
  (n, r) => n + r.endpoints.length,
  0,
)

writeFileSync(resolve(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

console.log('UserRole', manifest.schemas.UserRole)
console.log('UserResponseDto.role', manifest.schemas.UserResponseDto.properties.role)
console.log(
  'CreateTicketDto.priority',
  manifest.schemas.CreateTicketDto.properties.priority,
)
console.log(
  'path sample',
  manifest.resources.find((r) => r.name === 'auth').endpoints[0].path,
)
console.log(
  'resources',
  manifest.resources.map((r) => r.name),
)
console.log('patched ok')
