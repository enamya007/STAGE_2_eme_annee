# Generation rules — manifeste → Angular (HttpClient / RxJS / TanStack Angular Query)

Table de correspondance pour la cible **Angular** (standalone, signals, OnPush). Ne couvre que la
partie **spécifique Angular** : service `HttpClient`, client HTTP partagé (interceptors), couche
query (`injectQuery`/`injectMutation`) et keys.

> Le mapping **TypeNode → type TS** et **TypeNode → schéma valibot/zod** (y compris les messages
> d'erreur FR par champ) est **identique** à celui de `generation-react.md` §1–§5 : s'y reporter.
> Ce document ne redéfinit que ce qui change côté Angular.

## 0. Versions visées

- Angular **≥ 16** pour `inject()` ; **≥ 17/19** pour standalone par défaut. Générer du standalone.
- `@tanstack/angular-query-experimental` **v5** pour la couche query (API `injectQuery`,
  `injectMutation`, `inject(QueryClient)`).
- `rxjs` 7+ (`lastValueFrom`).
- TypeScript strict.

## 1. Layout & nommage Angular

Épouser l'existant d'abord (cf. `conventions.md` §1). Layout Angular par défaut (sous `src/app/`) :

```text
src/app/
├── services/   <resource>.service.ts   # @Injectable, HttpClient, renvoie Observable<T>
├── types/      <resource>.type.ts      # modèles purs (type alias par défaut)
├── schemas/    <resource>.schema.ts    # valibot/zod + types inférés
├── keys/       <resource>.key.ts       # query key factory
├── queries/    <resource>.query.ts     # fonctions inject* (injectQuery/injectMutation)
└── interceptors/                       # (optionnel) auth + strip-empty-params
```

Conventions de fichier Angular (différentes du défaut React) :

| Artefact   | React (défaut)            | **Angular**                        |
| ---------- | ------------------------- | ---------------------------------- |
| types      | `types/<r>.ts`            | `types/<r>.type.ts`                |
| schémas    | `schema/<r>.schema.ts`    | `schemas/<r>.schema.ts` (pluriel)  |
| services   | `services/<r>.service.ts` | `services/<r>.service.ts` (classe) |
| keys       | `keys/<r>.keys.ts`        | `keys/<r>.key.ts`                  |
| couche query | `hooks/use<R>.ts`       | `queries/<r>.query.ts` (inject*)   |

**Détecter et suivre l'hôte** : si le projet utilise déjà `<r>.type.ts` / `.key.ts` (suffixe
singulier) ou un autre style, le reproduire à l'identique. Ne jamais imposer un suffixe contre
l'existant.

## 2. Service Angular — `services/<resource>.service.ts`

Un **service injectable** par ressource, pas un objet littéral. Règles :

- `@Injectable({ providedIn: 'root' })` (singleton, tree-shakable).
- `private readonly http = inject(HttpClient)` — **`inject()`**, jamais l'injection par constructeur.
- baseURL depuis l'**environment** : `private readonly base = environment.apiUrl` (cf. §6). Si tous
  les endpoints d'un groupe partagent un préfixe (`/admin`), le concaténer une fois dans `base`.
- Une **méthode par endpoint**, nom = `operationId` en camelCase ; commentaire `/** VERBE /path */`.
- Signature : **path params positionnels typés**, puis un objet `opts` regroupant `query` et/ou
  `body` : `method(id: string, opts: { body: CreateXxxInput })`. Omettre `opts` si l'endpoint n'a ni
  query ni body. `opts` optionnel (`opts?`) si query/body tous optionnels.
- Retour **`Observable<ResponseType>`** typé depuis `types/`. **Pas** de `.then()`, pas de
  `firstValueFrom` ici — le service reste purement RxJS ; la conversion en Promise se fait dans la
  couche query (§4).
- Query params : passer `{ params: opts.query ?? {} }`. Le nettoyage des valeurs `null`/`undefined`/`''`
  est délégué à l'**interceptor strip-empty-params** (§5). Si le projet n'a pas d'interceptor et n'en
  veut pas, construire un `HttpParams` filtré (boucle `if (v != null) params = params.set(k, String(v))`).
- **Ne pas valider le body** dans le service (décision projet : la validation se fait via
  `valibotValidator` dans les reactive forms). Le service passe `opts.body` tel quel.
- DELETE/POST sans body → passer `null` comme corps quand la signature HttpClient l'exige
  (`http.patch<T>(url, null)`).

Forme cible :

```ts
// AUTO-GENERATED — do not edit by hand. (en-tête de garde optionnel, cf. conventions §6)
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { CreateUserInput } from '../schemas/users.schema';
import type { User } from '../types/users.type';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** GET /users */
  listUsers(opts?: { query?: ListUsersQuery }): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`, { params: opts?.query ?? {} });
  }

  /** GET /users/{id} */
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/users/${id}`);
  }

  /** POST /users */
  createUser(opts: { body: CreateUserInput }): Observable<User> {
    return this.http.post<User>(`${this.base}/users`, opts.body);
  }

  /** PATCH /users/{id} */
  updateUser(id: string, opts: { body: Partial<CreateUserInput> }): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}`, opts.body);
  }

  /** DELETE /users/{id} */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }
}
```

## 3. Query keys — `keys/<resource>.key.ts`

Identique au pattern React (factory hiérarchique, `as const`). Pas de dépendance Angular ici.

```ts
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params?: ListUsersQuery) => [...usersKeys.lists(), params ?? {}] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};
```

## 4. Couche query Angular — `queries/<resource>.query.ts`

En Angular il n'y a **pas de hooks** : on expose des **fonctions `inject*`** qui appellent
`injectQuery` / `injectMutation`. Ces fonctions **doivent être appelées dans un contexte
d'injection** (initialiseur de champ d'un composant/service, ou `runInInjectionContext`).

Règles clés :

- Importer `injectQuery`, `injectMutation`, `QueryClient` depuis
  `@tanstack/angular-query-experimental` (le package re-exporte `QueryClient` de `query-core`).
- Récupérer le service via `inject(UsersService)` **dans** la fonction `inject*` (contexte
  d'injection garanti par l'appelant).
- `queryFn`/`mutationFn` convertissent l'`Observable` du service en Promise avec
  **`lastValueFrom`** (rxjs). `lastValueFrom` (et non `firstValueFrom`) : l'appel HTTP émet une
  seule valeur puis complète.
- **Réactivité** : passer les paramètres dynamiques (id, filtres) en **fonctions/signals**
  (`() => T`) et les appeler à l'intérieur de la callback d'options de `injectQuery`, pour que la
  query se ré-exécute quand ils changent. La callback d'options re-tourne à chaque changement, donc
  chaque champ est une **valeur** (pas une fonction) : `enabled: Boolean(id())` (et **non**
  `() => Boolean(id())` — ce n'est pas le pattern Angular, cf. doc `enabled: !!this.filter()`).
- `QueryClient` via `inject(QueryClient)` (le `injectQueryClient()` est **déprécié** — ne pas
  l'utiliser). Invalider les listes sur succès de mutation.

```ts
import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { usersKeys } from '../keys/users.key';
import { UsersService } from '../services/users.service';
import type { CreateUserInput } from '../schemas/users.schema';

/** Liste — params réactifs optionnels (signal ou fonction). */
export function injectUsersList(params?: () => ListUsersQuery | undefined) {
  const service = inject(UsersService);

  return injectQuery(() => ({
    queryKey: usersKeys.list(params?.()),
    queryFn: () => lastValueFrom(service.listUsers({ query: params?.() })),
  }));
}

/** Détail — id réactif requis. */
export function injectUser(id: () => string) {
  const service = inject(UsersService);

  return injectQuery(() => ({
    queryKey: usersKeys.detail(id()),
    queryFn: () => lastValueFrom(service.getUser(id())),
    enabled: () => Boolean(id()),
  }));
}

export function injectCreateUser() {
  const service = inject(UsersService);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: (body: CreateUserInput) => lastValueFrom(service.createUser({ body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.lists() }),
  }));
}

export function injectUpdateUser() {
  const service = inject(UsersService);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateUserInput> }) =>
      lastValueFrom(service.updateUser(id, { body })),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  }));
}

export function injectDeleteUser() {
  const service = inject(UsersService);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(service.deleteUser(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.lists() }),
  }));
}
```

Usage en composant (à titre indicatif, non généré) :

```ts
export class UsersPage {
  private readonly page = signal<ListUsersQuery>({ page: 1 });
  readonly usersQuery = injectUsersList(() => this.page());
  readonly createUser = injectCreateUser();
}
```

> Si l'utilisateur a choisi « keys seulement » (pas de fonctions inject*), ne pas générer
> `queries/` : produire keys + services, et laisser le dev câbler `injectQuery`/`injectMutation`
> inline dans ses composants (avec `lastValueFrom(service.method(...))`).

## 5. Client HTTP partagé Angular — interceptors (le « tout ce qui va avec »)

Angular **n'a pas d'instance** type axios : `HttpClient` est fourni par `provideHttpClient()`. La
configuration transverse (token d'auth, normalisation d'erreur, nettoyage des query params) passe
par des **functional interceptors** (`HttpInterceptorFn`, Angular ≥ 15).

**Avant de générer**, vérifier l'existant (cf. `stack-detection.md` §1b-Angular) :

- Si `provideHttpClient()` est déjà configuré avec des interceptors (auth/refresh) → **ne rien
  recréer**, réutiliser. Les services importent juste `HttpClient`.
- Si aucun interceptor d'auth/params n'existe et que l'utilisateur en veut un → générer
  `interceptors/auth.interceptor.ts` et/ou `interceptors/strip-empty-params.interceptor.ts` depuis
  le template, et **rappeler** de les enregistrer :
  `provideHttpClient(withInterceptors([authInterceptor, stripEmptyParamsInterceptor]))` dans
  `app.config.ts`.

Ne jamais réécrire un interceptor d'auth/refresh existant — il est souvent plus fin que le template.

## 6. Environment / baseURL Angular

Pas de `.env` : Angular utilise `src/environments/environment.ts` (+ `.prod.ts`) avec un objet
`environment`. Chercher la clé d'URL d'API (`apiUrl`, `apiBaseUrl`, `baseUrl`). Les services font
`environment.apiUrl`. Si la clé n'existe pas, proposer de l'ajouter aux deux fichiers d'environment
et de confronter à `source.baseUrl` du manifeste (utiliser la valeur de la spec comme fallback/dev).

## 7. Style de sortie Angular

Reproduire le style du projet (`.prettierrc`, `.editorconfig`, fichiers voisins) :

- Imports : `@angular/*` d'abord, puis rxjs/tanstack, puis imports relatifs ; `import type` pour les
  types purs.
- Point-virgules **présents** (convention Angular/TS standard), guillemets selon Prettier.
- `inject()` partout (pas de constructeur), `readonly` sur les champs injectés.
- Si le projet protège ses fichiers auto-générés par un en-tête de garde
  (`// AUTO-GENERATED — do not edit by hand…`), le reproduire **uniquement** si l'utilisateur veut
  un flux re-générable strict ; sinon les fichiers api-forge sont éditables à la main (cf.
  conventions §6).
- Ne pas modifier les dossiers protégés (`src/@core`, `src/@menu`, `src/@layouts` sur les templates
  Vuexy).
