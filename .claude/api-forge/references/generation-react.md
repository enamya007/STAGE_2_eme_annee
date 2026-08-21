# Generation rules — manifeste → TypeScript / valibot / zod (React/Next)

Ce document est la table de correspondance que Claude applique pour transformer chaque `TypeNode`
du manifeste en types TS et en schémas de validation. Objectif : code **correct du premier coup**,
honorant toutes les contraintes.

## 1. TypeNode → type TypeScript

| TypeNode.kind            | TypeScript                                              |
| ------------------------ | ------------------------------------------------------ |
| `string`                 | `string`                                               |
| `integer` / `number`     | `number`                                               |
| `boolean`                | `boolean`                                              |
| `enum` (string)          | union de littéraux : `'ADMIN' \| 'USER'`               |
| `enum` (number)          | union numérique : `1 \| 2 \| 3`                        |
| `array`                  | `Item[]`                                                |
| `object`                 | `type` alias nommé (défaut) ou type inline `{ ... }` — `interface` seulement si demandé |
| `record`                 | `Record<string, V>`                                    |
| `ref`                    | le nom du type référencé (import)                      |
| `union` (anyOf/oneOf)    | `A \| B`                                               |
| `unknown`                | `unknown` (jamais `any` silencieux)                    |

**Optional vs nullable (deux axes distincts) :**

| required | nullable | propriété TS                  |
| -------- | -------- | ----------------------------- |
| true     | false    | `name: string`                |
| false    | false    | `name?: string`               |
| true     | true     | `name: string \| null`        |
| false    | true     | `name?: string \| null`       |

`readOnly` → uniquement dans le type de **réponse**. `writeOnly` → uniquement dans le **payload**.

**`type` vs `interface` (déclaration des modèles) :**

- **Défaut : `type` alias** (`export type User = { ... }`). Plus cohérent avec les types inférés des
  schémas (`type CreateUserInput = ...`), les unions, les `Pick`/`Omit`, et évite le merging
  implicite des interfaces.
- **`interface`** seulement si : (a) l'utilisateur le demande explicitement, ou (b) le projet hôte
  déclare déjà ses modèles en `interface` → on **épouse la convention existante** (cf. conventions.md §4).
- Détecter la convention de l'hôte : si `types/`/`models/` existants utilisent majoritairement
  `export interface`, suivre ce style ; sinon, `type`. Ne pas mélanger les deux dans un même projet.
- Cas où `interface` reste pertinent même par défaut : type **générique extensible** destiné à être
  étendu (`extends`), p.ex. un `Paginated<T>` partagé — acceptable ponctuellement.

## 1bis. Messages d'erreur de validation (par champ, en français)

**Règle : chaque contrainte porte un message d'erreur explicite, jamais le message par défaut de la
lib** (en anglais et générique). Objectif : un formulaire react-hook-form affiche directement un
message lisible par l'utilisateur final.

**Langue.** Par défaut **français**. Si le projet a une i18n (dossier `dictionaries/`,
`messages/`, `locales/`, ou clé `defaultLocale`), suivre la **locale par défaut** détectée. Si l'app
est multilingue avec un système de traduction, préférer des **clés de traduction** plutôt que du
texte en dur (ex. `t('validation.name.required')`) — proposer cette variante à l'utilisateur.

**Libellé de champ.** Dériver un libellé humain du nom de propriété : `firstName` → « prénom »,
`telephone` → « téléphone ». Construire une petite table `name → libellé` quand le manifeste ne
fournit pas de `title`/`description`; sinon réutiliser `title`. Le message nomme le champ.

**Catalogue de messages (gabarits)** — `{champ}` = libellé du champ :

| Contrainte                    | Message français                                              |
| ----------------------------- | ------------------------------------------------------------ |
| requis (manquant / vide)      | `Le {champ} est requis` (ou `La {champ} est requise` au féminin) |
| mauvais type                  | `Le {champ} est invalide`                                    |
| `minLength(n)`                | `Le {champ} doit contenir au moins {n} caractères`           |
| `maxLength(n)`                | `Le {champ} ne doit pas dépasser {n} caractères`             |
| `minimum(n)` / `maximum(n)`   | `Le {champ} doit être ≥ {n}` / `… ≤ {n}`                     |
| `format: email`               | `Adresse email invalide`                                     |
| `format: uuid`                | `Identifiant invalide`                                       |
| `format: url`                 | `URL invalide`                                               |
| `format: date`/`date-time`    | `Date invalide`                                              |
| `pattern`                     | `Le {champ} n'est pas au bon format` (préciser si connu, ex. « 8 chiffres ») |
| `enum` (valeur hors liste)    | `Valeur invalide pour {champ}`                               |
| `minItems(n)` / `maxItems(n)` | `Sélectionnez au moins {n} élément(s)` / `… au plus {n}`     |

**Accord en genre :** choisir « Le/La » et « requis/requise » selon le libellé (téléphone → masculin,
adresse → féminin). En cas de doute, formuler neutre : `{Champ} requis` (libellé capitalisé en tête).

Voir §2 (valibot) et §3 (zod) pour le placement exact du message dans chaque API.

## 2. TypeNode → schéma **valibot**

Import : `import * as v from 'valibot'` (ou imports nommés selon le style du projet).

| Source                       | valibot                                              |
| ---------------------------- | ---------------------------------------------------- |
| `string`                     | `v.string()`                                         |
| `integer`                    | `v.pipe(v.number(), v.integer())`                    |
| `number`                     | `v.number()`                                         |
| `boolean`                    | `v.boolean()`                                        |
| `enum: [...]`                | `v.picklist(['ADMIN','USER'])`                       |
| `array` items=T              | `v.array(<T>)`                                       |
| `object`                     | `v.object({ ... })`                                  |
| `ref`                        | réutiliser le schéma nommé importé                   |
| `record` values=V            | `v.record(v.string(), <V>)`                          |
| `union` anyOf=[A,B]          | `v.union([<A>, <B>])`                                |
| `unknown`                    | `v.unknown()`                                        |

Contraintes → pipes (composer avec `v.pipe(base, ...actions)`). **Chaque action prend son message en
dernier argument** (cf. §1bis) :

| constraint / format          | action valibot (avec message)                                  |
| ---------------------------- | -------------------------------------------------------------- |
| `minLength` / `maxLength`    | `v.minLength(n, 'Le {champ} doit contenir au moins n caractères')` / `v.maxLength(n, '…')` |
| `pattern`                    | `v.regex(/.../, 'Le {champ} n\'est pas au bon format')`         |
| `minimum` / `maximum`        | `v.minValue(n, 'Le {champ} doit être ≥ n')` / `v.maxValue(n, '…')` |
| `format: email`              | `v.email('Adresse email invalide')`                            |
| `format: uuid`               | `v.uuid('Identifiant invalide')`                               |
| `format: url`/`uri`          | `v.url('URL invalide')`                                         |
| `format: date-time`          | `v.isoTimestamp('Date invalide')`                              |
| `format: date`               | `v.isoDate('Date invalide')`                                   |
| `minItems` / `maxItems`      | `v.minLength(n, 'Sélectionnez au moins n élément(s)')` (array) |
| champ requis non vide        | `v.nonEmpty('Le {champ} est requis')`                          |

**Champ requis (string).** Le message du **type de base** couvre la valeur manquante / de mauvais
type ; ajouter `v.nonEmpty(...)` pour la chaîne vide. Le motif standard d'un string requis :

```ts
nom: v.pipe(v.string('Le nom est requis'), v.nonEmpty('Le nom est requis'))
```

`v.string('…')` → message si la clé est absente ou n'est pas une string ; `v.nonEmpty('…')` → message
si `''`. Pour un nombre/booléen requis, passer le message au constructeur : `v.number('L\'âge est requis')`.

Optional / nullable (le message du `v.string(...)` interne reste utile pour le mauvais type) :
- optionnel (`required:false`) → `v.optional(<schema>)`
- nullable → `v.nullable(<schema>)`
- les deux → `v.nullish(<schema>)`

Types inférés (à exporter dans le fichier schéma) :
```ts
export type CreateUserInput = v.InferInput<typeof createUserSchema>
export type CreateUserOutput = v.InferOutput<typeof createUserSchema>
```

## 3. TypeNode → schéma **zod**

Import : `import { z } from 'zod'`.

| Source                       | zod                                                  |
| ---------------------------- | ---------------------------------------------------- |
| `string`                     | `z.string()`                                         |
| `integer`                    | `z.number().int()`                                   |
| `number`                     | `z.number()`                                         |
| `boolean`                    | `z.boolean()`                                        |
| `enum: [...]`                | `z.enum(['ADMIN','USER'])`                           |
| `array` items=T              | `z.array(<T>)`                                       |
| `object`                     | `z.object({ ... })`                                  |
| `ref`                        | réutiliser le schéma nommé importé                   |
| `record` values=V            | `z.record(z.string(), <V>)`                          |
| `union`                      | `z.union([<A>, <B>])`                                |
| `unknown`                    | `z.unknown()`                                        |

Contraintes — **chaque méthode reçoit son message** (cf. §1bis) :

| constraint / format          | zod (avec message)                                           |
| ---------------------------- | ----------------------------------------------------------- |
| `minLength`/`maxLength`      | `.min(n, 'Le {champ} doit contenir au moins n caractères')` / `.max(n, '…')` |
| `pattern`                    | `.regex(/.../, 'Le {champ} n\'est pas au bon format')`      |
| `minimum`/`maximum`          | `.min(n, 'Le {champ} doit être ≥ n')` / `.max(n, '…')`     |
| `format: email`              | `.email('Adresse email invalide')`                          |
| `format: uuid`               | `.uuid('Identifiant invalide')`                             |
| `format: url`                | `.url('URL invalide')`                                       |
| `format: date-time`         | `.datetime('Date invalide')`                                |
| `minItems`/`maxItems`        | `.min(n, 'Sélectionnez au moins n élément(s)')` (array)     |

**Champ requis (string).** Renseigner le message du constructeur (clé manquante / mauvais type) ET
`.min(1, …)` pour la chaîne vide. Selon la version de zod :

```ts
// zod 3
nom: z.string({ required_error: 'Le nom est requis', invalid_type_error: 'Le nom est invalide' })
  .min(1, 'Le nom est requis')

// zod 4 : message unifié via `error`
nom: z.string({ error: 'Le nom est requis' }).min(1, 'Le nom est requis')
```

Détecter la version de zod dans `package.json` et générer la forme correspondante (ne pas mélanger).

Optional / nullable : `.optional()` · `.nullable()` · `.nullish()`.

Type inféré :
```ts
export type CreateUserInput = z.infer<typeof createUserSchema>
```

## 4. Quels schémas générer ?

- Schéma **d'entrée** par endpoint ayant un `requestBody` (POST/PUT/PATCH) → valider le payload.
- Schéma pour les `queryParams` contraints si pertinent (ex. filtres validés).
- Schémas de **réponse** : optionnels par défaut (coût runtime). Les générer si l'utilisateur veut
  valider/parser les réponses, ou en mode « une seule source de vérité » (cf. conventions §5).
- Réutiliser les schémas `ref` : un `components/schemas/User` → un seul `userSchema` importé partout.

## 5. Pagination & enveloppes

Repérer les réponses enveloppées et les modéliser une fois, en générique :
```ts
export interface Paginated<T> {
  data: T[]
  meta?: { total?: number; page?: number; pageSize?: number }
}
```
Les services renvoient alors `Paginated<User>`. Réutiliser un type générique existant du projet
s'il y en a un (ex. `src/types/api/common.ts`).

## 6. Service par endpoint

Pour chaque endpoint, générer une méthode :
- nom = `operationId` (camelCase) ;
- arguments = path params (typés), puis `params` (query) si présents, puis `body` (typé via le type
  d'input) ;
- substitue les path params dans l'URL ; passe `params`/`body` au client HTTP ;
- valide `body` avec le schéma d'entrée avant l'appel (parse + throw si invalide) ;
- retour `Promise<ResponseType>` typé depuis `types/`.

Exemple (axios + valibot) :
```ts
export const usersService = {
  listUsers: (params?: ListUsersParams) =>
    http.get<User[]>('/users', { params }).then(r => r.data),

  getUser: (id: string) =>
    http.get<User>(`/users/${id}`).then(r => r.data),

  createUser: (body: CreateUserInput) =>
    http.post<User>('/users', v.parse(createUserSchema, body)).then(r => r.data)
}
```

## 7. Query keys & hooks (TanStack)

Factory hiérarchique, centralisée par ressource :
```ts
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params?: ListUsersParams) => [...usersKeys.lists(), params ?? {}] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const
}
```
Hooks :
```ts
export const useUsers = (params?: ListUsersParams) =>
  useQuery({ queryKey: usersKeys.list(params), queryFn: () => usersService.listUsers(params) })

export const useCreateUser = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.lists() })
  })
}
```
Fichiers hooks → `'use client'` en tête sous Next App Router.

## 8. Style de sortie

Reproduire le style du projet (lire `.prettierrc`, `.eslintrc`, fichiers voisins) :
imports groupés avec bannières de commentaire, `import type` pour les types, optional chaining
`obj?.prop`, propriétés CSS logiques si applicable, point-virgule/quotes selon Prettier.
Lancer `lint:fix`/`format` du projet après génération si disponibles.
