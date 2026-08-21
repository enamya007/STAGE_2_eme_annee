#!/usr/bin/env node
// normalize-collection.mjs
//
// Normalise une collection API (OpenAPI 3.x / Swagger 2.0 / Postman v2.1) en un
// MANIFESTE uniforme consommé par le skill api-forge. Le manifeste est le "langage
// pivot" : la génération de code ne dépend jamais du format source.
//
// Usage:
//   node normalize-collection.mjs <input.json> [--out manifest.json] [--pretty]
//   node normalize-collection.mjs <input.json>            # imprime le manifeste sur stdout
//
// Entrée: JSON uniquement. Si la spec est en YAML, la convertir en JSON en amont
// (voir l'étape 1 du SKILL.md). Aucune dépendance npm requise.
//
// Voir references/manifest-schema.md pour le contrat de sortie complet.

import { readFileSync, writeFileSync } from 'node:fs'

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = { _: [], out: null, pretty: true }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]

    if (a === '--out' || a === '-o') args.out = argv[++i]
    else if (a === '--pretty') args.pretty = true
    else if (a === '--no-pretty') args.pretty = false
    else if (a === '--help' || a === '-h') args.help = true
    else args._.push(a)
  }

  return args
}

function die(msg) {
  process.stderr.write(`[api-forge] ERREUR: ${msg}\n`)
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Helpers généraux                                                    */
/* ------------------------------------------------------------------ */

const isObj = v => v != null && typeof v === 'object' && !Array.isArray(v)

// PascalCase pour les noms de schémas / ressources
function pascal(str) {
  return String(str)
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Unknown'
}

// camelCase pour les opérations / propriétés
function camel(str) {
  const p = pascal(str)

  return p.charAt(0).toLowerCase() + p.slice(1)
}

// kebab-case pour les noms de fichiers / ressources
function kebab(str) {
  return String(str)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'unknown'
}

/* ------------------------------------------------------------------ */
/* Type node — représentation normalisée d'un schéma                   */
/* ------------------------------------------------------------------ */
//
// { kind, ref?, items?, properties?, enum?, format?, constraints?, nullable?,
//   description?, anyOf? }
//
// kind ∈ object | array | string | number | integer | boolean | enum
//        | ref | union | record | unknown

function constraintsOf(schema) {
  const c = {}
  const keys = [
    'minLength', 'maxLength', 'pattern',
    'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
    'minItems', 'maxItems', 'uniqueItems'
  ]

  for (const k of keys) {
    if (schema[k] !== undefined) c[k] = schema[k]
  }

  return Object.keys(c).length ? c : undefined
}

/* ------------------------------------------------------------------ */
/* OpenAPI 3.x + Swagger 2.0                                           */
/* ------------------------------------------------------------------ */

function makeOpenApiNormalizer(doc, isV2) {
  // composants/définitions nommés -> alimentent manifest.schemas
  const namedSchemas = isV2 ? (doc.definitions || {}) : (doc.components?.schemas || {})
  const refPrefix = isV2 ? '#/definitions/' : '#/components/schemas/'
  const emitted = {} // name -> typeNode (résolu)
  const visiting = new Set()

  function refName(ref) {
    if (typeof ref !== 'string') return null
    if (ref.startsWith(refPrefix)) return ref.slice(refPrefix.length)
    // fallback: dernier segment
    return ref.split('/').pop()
  }

  function resolveNode(schema, ctx = '') {
    if (!isObj(schema)) return { kind: 'unknown' }

    // $ref -> node ref (et garantit l'émission du schéma cible)
    if (schema.$ref) {
      const name = refName(schema.$ref)

      if (name) {
        ensureEmitted(name)

        return { kind: 'ref', ref: pascal(name) }
      }

      return { kind: 'unknown' }
    }

    // allOf -> fusion d'objets (héritage)
    if (Array.isArray(schema.allOf)) {
      const merged = { kind: 'object', properties: {} }
      let nullable = !!schema.nullable

      for (const part of schema.allOf) {
        const node = resolveNode(part, ctx)
        const obj = node.kind === 'ref' ? emitted[node.ref] : node

        if (obj?.properties) Object.assign(merged.properties, obj.properties)
        if (obj?.nullable) nullable = true
      }

      // propriétés directes éventuelles à côté du allOf
      if (isObj(schema.properties)) {
        Object.assign(merged.properties, objectProps(schema))
      }

      if (nullable) merged.nullable = true
      if (schema.description) merged.description = schema.description

      return merged
    }

    // oneOf / anyOf -> union
    const variants = schema.oneOf || schema.anyOf

    if (Array.isArray(variants)) {
      return {
        kind: 'union',
        anyOf: variants.map(v => resolveNode(v, ctx)),
        nullable: !!schema.nullable,
        description: schema.description
      }
    }

    // enum -> kind enum
    if (Array.isArray(schema.enum)) {
      return {
        kind: 'enum',
        enum: schema.enum,
        baseType: schema.type || (typeof schema.enum[0]),
        nullable: !!schema.nullable || schema.enum.includes(null),
        description: schema.description
      }
    }

    const type = schema.type || inferType(schema)

    // tableau
    if (type === 'array') {
      return {
        kind: 'array',
        items: resolveNode(schema.items || {}, ctx),
        constraints: constraintsOf(schema),
        nullable: !!schema.nullable,
        description: schema.description
      }
    }

    // objet
    if (type === 'object' || schema.properties || schema.additionalProperties) {
      // dictionnaire / record
      if (!schema.properties && schema.additionalProperties) {
        return {
          kind: 'record',
          values: isObj(schema.additionalProperties)
            ? resolveNode(schema.additionalProperties, ctx)
            : { kind: 'unknown' },
          nullable: !!schema.nullable,
          description: schema.description
        }
      }

      return {
        kind: 'object',
        properties: objectProps(schema),
        nullable: !!schema.nullable,
        description: schema.description
      }
    }

    // primitif
    return {
      kind: ['string', 'number', 'integer', 'boolean'].includes(type) ? type : 'unknown',
      format: schema.format,
      constraints: constraintsOf(schema),
      nullable: !!schema.nullable,
      default: schema.default,
      description: schema.description
    }
  }

  function objectProps(schema) {
    const out = {}
    const required = new Set(schema.required || [])
    const props = schema.properties || {}

    for (const [key, raw] of Object.entries(props)) {
      const node = resolveNode(raw, key)

      node.required = required.has(key)
      // nullable hérité d'un éventuel "type": ["string","null"] géré dans inferType
      if (raw && raw.nullable) node.nullable = true
      if (raw?.readOnly) node.readOnly = true
      if (raw?.writeOnly) node.writeOnly = true
      out[key] = node
    }

    return out
  }

  function inferType(schema) {
    // OpenAPI 3.1 / JSON Schema: type peut être un tableau ["string","null"]
    if (Array.isArray(schema.type)) {
      const t = schema.type.filter(x => x !== 'null')

      schema.nullable = schema.type.includes('null') || schema.nullable

      return t[0]
    }

    if (schema.properties) return 'object'
    if (schema.items) return 'array'

    return schema.type
  }

  function ensureEmitted(name) {
    const key = pascal(name)

    if (emitted[key] || visiting.has(key)) return
    visiting.add(key)
    const raw = namedSchemas[name] || namedSchemas[key]

    emitted[key] = raw ? resolveNode(raw, name) : { kind: 'unknown' }
    visiting.delete(key)
  }

  // émet tous les schémas nommés d'emblée (référencés ou non)
  function emitAll() {
    for (const name of Object.keys(namedSchemas)) ensureEmitted(name)

    return emitted
  }

  return { resolveNode, emitAll, refName }
}

function normalizeOpenApi(doc, isV2) {
  const N = makeOpenApiNormalizer(doc, isV2)
  const schemas = N.emitAll()

  const baseUrl = isV2
    ? `${(doc.schemes && doc.schemes[0]) || 'https'}://${doc.host || ''}${doc.basePath || ''}`
    : (doc.servers && doc.servers[0]?.url) || ''

  const resources = new Map() // name -> endpoints[]

  const paths = doc.paths || {}
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isObj(pathItem)) continue

    const sharedParams = pathItem.parameters || []

    for (const method of methods) {
      const op = pathItem[method]

      if (!isObj(op)) continue

      const allParams = [...sharedParams, ...(op.parameters || [])]
        .map(p => (p.$ref ? resolveParamRef(doc, p.$ref, isV2) : p))
        .filter(Boolean)

      const pathParams = []
      const queryParams = []
      const headerParams = []

      for (const p of allParams) {
        const schemaNode = isV2
          ? N.resolveNode(paramSchemaV2(p))
          : N.resolveNode(p.schema || {})

        const entry = {
          name: p.name,
          required: !!p.required || p.in === 'path',
          type: schemaNode,
          description: p.description
        }

        if (p.in === 'path') pathParams.push(entry)
        else if (p.in === 'query') queryParams.push(entry)
        else if (p.in === 'header') headerParams.push(entry)
        else if (p.in === 'body' && isV2) {
          // Swagger 2.0 body param
          op.__bodyV2 = { required: !!p.required, schema: N.resolveNode(p.schema || {}) }
        }
      }

      // request body
      let requestBody = null

      if (!isV2 && op.requestBody) {
        const rb = op.requestBody.$ref
          ? resolveRef(doc, op.requestBody.$ref)
          : op.requestBody
        const content = rb.content || {}
        const ct = content['application/json']
          || content['application/x-www-form-urlencoded']
          || content['multipart/form-data']
          || Object.values(content)[0]

        if (ct) {
          requestBody = {
            required: !!rb.required,
            contentType: Object.keys(content)[0] || 'application/json',
            schema: N.resolveNode(ct.schema || {})
          }
        }
      } else if (isV2 && op.__bodyV2) {
        requestBody = {
          required: op.__bodyV2.required,
          contentType: 'application/json',
          schema: op.__bodyV2.schema
        }
      }

      // réponse de succès (2xx)
      const responses = op.responses || {}
      const successCode = Object.keys(responses)
        .filter(c => /^2\d\d$/.test(c))
        .sort()[0] || (responses.default ? 'default' : null)

      let successSchema = { kind: 'unknown' }
      let successStatus = successCode && successCode !== 'default' ? Number(successCode) : 200

      if (successCode) {
        const resp = responses[successCode]
        const r = resp?.$ref ? resolveRef(doc, resp.$ref) : resp

        if (isV2) {
          successSchema = r?.schema ? N.resolveNode(r.schema) : { kind: 'unknown' }
        } else {
          const content = r?.content || {}
          const ct = content['application/json'] || Object.values(content)[0]

          successSchema = ct?.schema ? N.resolveNode(ct.schema) : { kind: 'unknown' }
        }
      }

      // groupement par tag, fallback 1er segment de path
      const tag = (op.tags && op.tags[0]) || firstSegment(path)
      const resName = kebab(tag)

      if (!resources.has(resName)) resources.set(resName, [])

      resources.get(resName).push({
        operationId: op.operationId || defaultOpId(method, path),
        method,
        path,
        summary: op.summary || op.description || '',
        deprecated: !!op.deprecated,
        pathParams,
        queryParams,
        headerParams,
        requestBody,
        response: { status: successStatus, schema: successSchema }
      })
    }
  }

  return {
    source: {
      format: isV2 ? 'swagger2' : 'openapi3',
      title: doc.info?.title || 'API',
      version: doc.info?.version || '',
      baseUrl
    },
    schemas: Object.fromEntries(Object.entries(schemas).map(([k, v]) => [pascal(k), v])),
    resources: [...resources.entries()].map(([name, endpoints]) => ({ name, endpoints }))
  }
}

function paramSchemaV2(p) {
  // Swagger 2.0: les params non-body portent type/format directement
  const { type, format, enum: en, items, minLength, maxLength, minimum, maximum, pattern } = p

  return { type, format, enum: en, items, minLength, maxLength, minimum, maximum, pattern }
}

function resolveRef(doc, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return {}
  const parts = ref.slice(2).split('/')
  let cur = doc

  for (const part of parts) {
    cur = cur?.[decodeURIComponent(part.replace(/~1/g, '/').replace(/~0/g, '~'))]
    if (cur === undefined) return {}
  }

  return cur || {}
}

function resolveParamRef(doc, ref, _isV2) {
  return resolveRef(doc, ref)
}

function firstSegment(path) {
  const seg = String(path).split('/').filter(Boolean)[0] || 'default'

  return seg.replace(/[{}].*$/g, '') || 'default'
}

function defaultOpId(method, path) {
  const segs = String(path).split('/').filter(Boolean).map(s => s.replace(/[{}]/g, ''))

  return camel(`${method} ${segs.join(' ')}`)
}

/* ------------------------------------------------------------------ */
/* Postman v2.1                                                        */
/* ------------------------------------------------------------------ */

function normalizePostman(doc) {
  const resources = new Map()
  const baseVar = (doc.variable || []).find(v => /base.?url|host/i.test(v.key))
  const baseUrl = baseVar?.value || ''

  function walk(items, parentName) {
    for (const item of items || []) {
      if (Array.isArray(item.item)) {
        // dossier -> ressource
        walk(item.item, item.name || parentName)
      } else if (item.request) {
        addRequest(item, parentName || 'default')
      }
    }
  }

  function addRequest(item, folder) {
    const req = item.request
    const method = String(req.method || 'GET').toLowerCase()
    const urlObj = isObj(req.url) ? req.url : { raw: req.url }
    const rawPath = urlObj.path
      ? '/' + (Array.isArray(urlObj.path) ? urlObj.path.join('/') : urlObj.path)
      : pathFromRaw(urlObj.raw)

    const path = rawPath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}')

    const pathParams = []
    const m = path.match(/\{([^}]+)\}/g) || []

    for (const tok of m) {
      pathParams.push({ name: tok.slice(1, -1), required: true, type: { kind: 'string' } })
    }

    const queryParams = (urlObj.query || [])
      .filter(q => !q.disabled)
      .map(q => ({ name: q.key, required: false, type: inferFromExample(q.value), description: q.description }))

    let requestBody = null

    if (req.body && req.body.mode === 'raw' && req.body.raw) {
      const schema = schemaFromJsonExample(req.body.raw)

      if (schema) requestBody = { required: true, contentType: 'application/json', schema }
    } else if (req.body && req.body.mode === 'urlencoded') {
      const props = {}

      for (const f of req.body.urlencoded || []) {
        if (f.disabled) continue
        props[f.key] = { ...inferFromExample(f.value), required: true }
      }

      requestBody = { required: true, contentType: 'application/x-www-form-urlencoded', schema: { kind: 'object', properties: props } }
    }

    // réponse: 1er exemple sauvegardé s'il existe
    let response = { status: 200, schema: { kind: 'unknown' } }
    const ex = (item.response || [])[0]

    if (ex && ex.body) {
      const schema = schemaFromJsonExample(ex.body)

      if (schema) response = { status: ex.code || 200, schema }
    }

    const resName = kebab(folder)

    if (!resources.has(resName)) resources.set(resName, [])

    resources.get(resName).push({
      operationId: camel(item.name || defaultOpId(method, path)),
      method,
      path,
      summary: item.name || '',
      deprecated: false,
      pathParams,
      queryParams,
      headerParams: [],
      requestBody,
      response
    })
  }

  walk(doc.item, null)

  return {
    source: {
      format: 'postman2',
      title: doc.info?.name || 'API',
      version: doc.info?.version || '',
      baseUrl
    },
    schemas: {},
    resources: [...resources.entries()].map(([name, endpoints]) => ({ name, endpoints }))
  }
}

function pathFromRaw(raw) {
  if (!raw) return '/'
  try {
    const stripped = String(raw).replace(/\{\{[^}]+\}\}/g, '')
    const u = new URL(stripped.startsWith('http') ? stripped : `http://x${stripped.startsWith('/') ? '' : '/'}${stripped}`)

    return u.pathname || '/'
  } catch {
    return '/' + String(raw).replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '')
  }
}

function inferFromExample(value) {
  if (value == null) return { kind: 'string' }
  if (/^-?\d+$/.test(value)) return { kind: 'integer' }
  if (/^-?\d*\.\d+$/.test(value)) return { kind: 'number' }
  if (/^(true|false)$/i.test(value)) return { kind: 'boolean' }

  return { kind: 'string' }
}

function schemaFromJsonExample(raw) {
  let parsed

  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  return inferJsonNode(parsed)
}

function inferJsonNode(v) {
  if (v === null) return { kind: 'unknown', nullable: true }
  if (Array.isArray(v)) return { kind: 'array', items: v.length ? inferJsonNode(v[0]) : { kind: 'unknown' } }
  if (typeof v === 'object') {
    const properties = {}

    for (const [k, val] of Object.entries(v)) {
      properties[k] = { ...inferJsonNode(val), required: true }
    }

    return { kind: 'object', properties }
  }
  if (typeof v === 'number') return { kind: Number.isInteger(v) ? 'integer' : 'number' }
  if (typeof v === 'boolean') return { kind: 'boolean' }

  // heuristiques de format sur les strings
  const s = String(v)
  let format

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) format = 'email'
  else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) format = 'uuid'
  else if (/^\d{4}-\d{2}-\d{2}T/.test(s)) format = 'date-time'

  return { kind: 'string', format }
}

/* ------------------------------------------------------------------ */
/* Détection de format + entrée                                        */
/* ------------------------------------------------------------------ */

function detectAndNormalize(doc) {
  if (doc.openapi && String(doc.openapi).startsWith('3')) return normalizeOpenApi(doc, false)
  if (doc.swagger && String(doc.swagger).startsWith('2')) return normalizeOpenApi(doc, true)
  if (doc.info && (Array.isArray(doc.item) || doc.item)) return normalizePostman(doc)

  // dernier recours: présence de "paths" => traiter comme OpenAPI 3
  if (doc.paths) return normalizeOpenApi(doc, false)

  die('Format non reconnu (ni OpenAPI 3.x, ni Swagger 2.0, ni Postman v2.1).')
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

function summarize(manifest) {
  const resources = manifest.resources.length
  const endpoints = manifest.resources.reduce((n, r) => n + r.endpoints.length, 0)
  const schemas = Object.keys(manifest.schemas).length

  return { resources, endpoints, schemas }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help || args._.length === 0) {
    process.stdout.write(
      'Usage: node normalize-collection.mjs <input.json> [--out manifest.json] [--no-pretty]\n'
    )
    process.exit(args.help ? 0 : 1)
  }

  const input = args._[0]
  let text

  try {
    text = readFileSync(input, 'utf8')
  } catch (e) {
    die(`Lecture impossible de "${input}": ${e.message}`)
  }

  let doc

  try {
    doc = JSON.parse(text)
  } catch (e) {
    die(`JSON invalide ("${input}"). Si la spec est en YAML, convertissez-la d'abord. ${e.message}`)
  }

  const manifest = detectAndNormalize(doc)

  manifest.stats = summarize(manifest)

  const json = JSON.stringify(manifest, null, args.pretty ? 2 : 0)

  if (args.out) {
    writeFileSync(args.out, json, 'utf8')
    const s = manifest.stats

    process.stderr.write(
      `[api-forge] Manifeste écrit -> ${args.out}\n` +
      `[api-forge] format=${manifest.source.format} | ressources=${s.resources} | endpoints=${s.endpoints} | schémas=${s.schemas}\n`
    )
  } else {
    process.stdout.write(json + '\n')
  }
}

main()
