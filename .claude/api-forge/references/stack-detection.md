# Stack detection — détecter la stack et les conventions du projet hôte

Objectif : adapter le code généré à ce que le projet utilise **déjà**, sans rien imposer.
Tout se décide à partir de `package.json`, des lockfiles, de `tsconfig.json` et de l'arborescence
existante. En cas d'ambiguïté → demander à l'utilisateur (ne pas deviner silencieusement).

## 1. Client HTTP — DEUX questions, dans l'ordre

### 1a. La lib est-elle installée ?

Lire `dependencies` + `devDependencies` :

| Détection                                  | Lib retenue                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| `axios` présent                            | **axios** (défaut).                                   |
| `ky` / `redaxios` présent (pas axios)      | réutiliser cette lib.                                 |
| aucune lib HTTP, projet Next/React         | **fetch** typé (fallback zéro-dépendance).            |
| aucune, l'utilisateur veut axios           | proposer `pnpm add axios` (bon gestionnaire) AVANT génération. |

Le client par défaut est **axios** ; le fallback zéro-dépendance est `fetch`.

### 1b. Une instance configurée existe-t-elle DÉJÀ ? (ne jamais dupliquer)

**Avant** de générer quoi que ce soit, chercher dans le code une instance/un wrapper déjà en place
et **le réutiliser** plutôt que d'en créer un nouveau. Sonder (Grep) :

- `axios.create(` — instance axios configurée (baseURL, intercepteurs, refresh token…).
- `export default api` / `export const http|api|client|axiosInstance` — point d'export.
- une **factory** (`export const createXxxApi = (token?) => axios.create(...)`) — fréquent côté serveur.
- un wrapper `fetch` maison (`export const http = { get, post, ... }`).
- `ky.create(` / `ky.extend(`.
- Emplacements usuels : `src/libs/api/`, `src/lib/`, `src/services/http*`, `src/api/`, `src/utils/`.

| Résultat de la recherche                         | Décision                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| Une instance configurée existe                   | **La réutiliser.** Importer depuis son chemin réel, NE PAS créer de nouvelle instance. |
| Plusieurs (ex. une **client** + une **serveur**) | Réutiliser chacune selon le contexte : instance navigateur pour les services client, factory serveur pour RSC/route handlers. |
| Lib installée mais aucune instance               | **Créer** l'instance partagée (`services/http/axios.ts` ou `fetch.ts`) depuis le template. |
| Aucune lib, aucune instance                      | Créer le wrapper `fetch` typé (ou installer axios si demandé).           |

**Adapter les services à la forme de l'instance réutilisée** (c'est ce qui évite du code cassé) :

- export **default** (`import api from '@/libs/api/axios'`) vs **nommé**
  (`import { http } from '...'`) → ajuster l'import et le nom dans les services.
- axios → les méthodes renvoient un `AxiosResponse` : déballer avec `.then(r => r.data)`.
- wrapper fetch / ky → renvoient déjà le payload : **pas** de `.then(r => r.data)`.
- **factory** (`createServerApi(token)`) → l'appelant instancie ; les services serveur reçoivent
  l'instance ou le token en argument plutôt qu'un singleton importé.
- Ne PAS réécrire les intercepteurs existants (auth, refresh token, nettoyage de params) : ils sont
  souvent plus fins que le template. Le template `http-*.ts.tmpl` ne sert qu'au cas « rien n'existe ».

> Exemple réel : un projet peut exposer une instance client `api` (export default, refresh+signOut
> sur 401) ET une factory serveur `createServerApi(token)`. Dans ce cas, les services client
> importent `api` et font `.then(r => r.data)` ; aucun `services/http/axios.ts` n'est généré.

## 2. Librairie de validation

| Détection                         | Décision                                                  |
| --------------------------------- | --------------------------------------------------------- |
| `valibot` seul                    | **valibot** (`object`/`pipe`, `InferInput`/`InferOutput`).|
| `zod` seul                        | **zod** (`z.object`, `z.infer`).                          |
| les deux présents                 | **Demander** lequel utiliser pour ce projet.              |
| aucun                             | **Demander** : installer valibot (léger) ou zod, ou skip. |

Resolver react-hook-form associé (si `react-hook-form` + `@hookform/resolvers` présents) :
- valibot → `@hookform/resolvers/valibot` (`valibotResolver`)
- zod → `@hookform/resolvers/zod` (`zodResolver`)

## 3. Query layer (TanStack)

| Détection                                  | Décision                                               |
| ------------------------------------------ | ------------------------------------------------------ |
| `@tanstack/react-query` présent            | Générer `keys/` (query key factories) + `hooks/` (useQuery/useMutation). |
| `react-query` (v3 legacy)                  | Signaler, proposer migration ; générer sans hooks par défaut. |
| absent, mais l'utilisateur le veut         | Proposer `pnpm add @tanstack/react-query` + setup du `QueryClientProvider`. |
| absent et non voulu                        | Pas de `keys/` ni `hooks/` — services seuls.           |

Vérifier aussi si un `QueryClientProvider` est déjà monté (chercher `QueryClient` dans
`providers`/`_app`/layout). Sinon, le signaler comme étape manuelle.

## 4. Framework & langage

- `@angular/core` présent → **Angular** : basculer sur la cible Angular (cf. §8 et
  `generation-angular.md`). HttpClient + Observable, `inject()`, TanStack **angular** query.
- `next` présent → Next.js (App Router si `app/` existe, sinon Pages Router). Respecter la frontière
  client/serveur : les hooks TanStack et l'instance axios navigateur sont **client** (`'use client'`).
- `react` sans `next` → SPA React (Vite/CRA).
- `typescript` présent → générer du `.ts`/`.tsx` (cas par défaut visé). Lire `tsconfig.json` pour
  `strict`, `paths` (alias d'import), `baseUrl`.

La détection du framework **précède** celle du client HTTP : en Angular, le client est `HttpClient`
(pas axios/fetch) et la couche query est `@tanstack/angular-query-experimental` — voir §8.

## 5. Gestionnaire de paquets

Détecter via lockfile : `pnpm-lock.yaml` → pnpm · `yarn.lock` → yarn · `package-lock.json` → npm ·
`bun.lockb` → bun. Utiliser le bon gestionnaire pour toute commande d'install proposée.

## 6. Alias d'import (tsconfig `paths`)

Lire `compilerOptions.paths`. Exemples fréquents : `@/*` → `src/*`. Générer les imports avec l'alias
détecté (`@/services/...`) plutôt que des chemins relatifs profonds. Si aucun alias, utiliser des
chemins relatifs corrects.

## 7. Base URL / variables d'environnement

Chercher dans `.env.example` / `.env` les variables d'URL d'API :
- Next public (navigateur) : `NEXT_PUBLIC_*_API_URL`, `NEXT_PUBLIC_API_URL`.
- Serveur uniquement : `BACKEND_API_URL`, `API_URL`.
- Vite : `VITE_*_API_URL`.

Préférer une variable **publique** pour l'instance axios navigateur. Confronter au `source.baseUrl`
du manifeste : si la spec donne un baseUrl mais que le projet a déjà une variable, utiliser la
variable et ne garder le baseUrl spec que comme valeur de repli/commentaire.

## 8. Cible Angular (surcharge les §1–§3 quand `@angular/core` est présent)

Quand Angular est détecté, la stack change : appliquer ce qui suit **au lieu** de la logique
axios/fetch (§1) et React-query (§3). Détails de génération dans `generation-angular.md`.

### 8a. Client HTTP = `HttpClient` (jamais axios/fetch)

- Le client est `@angular/common/http`. Ne **pas** générer d'instance axios ni de wrapper fetch.
- Vérifier que `provideHttpClient()` est configuré (chercher dans `app.config.ts` /
  `app.config.server.ts` / un `main.ts` bootstrap). Sinon, le signaler comme étape manuelle.
- **Interceptors existants** (§1b adapté) : Grep `HttpInterceptorFn`, `withInterceptors(`,
  `intercept(` (classes legacy), un service d'auth/refresh token. S'ils existent → **les réutiliser**,
  ne rien recréer. Sinon, proposer de générer `auth.interceptor.ts` / `strip-empty-params.interceptor.ts`
  (template `http-interceptors-angular`) et rappeler de les enregistrer dans `withInterceptors([...])`.

### 8b. Couche query = `@tanstack/angular-query-experimental`

| Détection                                          | Décision                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `@tanstack/angular-query-experimental` présent     | Générer `keys/` + (si choisi) `queries/` avec fonctions `inject*`. |
| absent, mais l'utilisateur le veut                 | Proposer l'install + `provideTanStackQuery(new QueryClient())`.    |
| absent et non voulu                                | Services seuls (HttpClient/Observable), pas de keys ni queries.    |

- `QueryClient` via **`inject(QueryClient)`** (re-exporté par le package). `injectQueryClient()` est
  **déprécié** → ne pas le générer.
- Vérifier que `provideTanStackQuery` est monté dans `app.config.ts` ; sinon le signaler.

### 8c. Validation

Identique aux §2 (valibot/zod). En Angular la validation de formulaire passe par `ReactiveFormsModule`
avec un pont `valibotValidator()` (chercher `src/app/utils/valibot-validator.ts` ou équivalent). Ne **pas**
valider le body dans le service (le formulaire valide en amont). Si le projet a une convention de
formulaire documentée (règles `.claude/`, `valibotValidator`), la suivre.

### 8d. baseURL & alias

- **Pas de `.env`** : lire `src/environments/environment.ts` (+ `.prod.ts`) et repérer la clé d'URL
  (`apiUrl`, `apiBaseUrl`, `baseUrl`). Les services font `environment.<clé>`.
- Alias d'import : lire `tsconfig.json`/`tsconfig.app.json` `paths` (souvent `@/*` → `src/app/*` ou
  `src/*`). Sinon, chemins relatifs corrects.

### 8e. Récap Angular (exemple)

```text
Stack détectée :
  • Framework   : Angular 21 (standalone, signals)
  • HTTP        : HttpClient -> services @Injectable renvoyant Observable<T>
  • Validation  : valibot 1.4 (+ valibotValidator pour les reactive forms)
  • Query       : @tanstack/angular-query-experimental 5.x -> keys/ + queries/ (inject*)
  • Env baseURL : environment.apiUrl
  • Interceptors: auth + strip-empty-params déjà présents (réutilisés)
  • Paquets     : npm
```

## Sortie de l'étape de détection

Produire un petit récap à confirmer par l'utilisateur, ex :

```
Stack détectée :
  • HTTP        : axios 1.13      -> services/http/axios.ts
  • Validation  : valibot 1.1     -> schémas object()/pipe(), InferInput/InferOutput
  • Query       : @tanstack/react-query 5.x -> keys/ + hooks/ générés
  • Framework   : Next.js (App Router), TS strict, alias @/* -> src/*
  • Env baseURL : NEXT_PUBLIC_BACKEND_API_URL (sinon spec: https://api.demo.test/v1)
  • Paquets     : pnpm
Confirmer ou surcharger (ex: forcer zod, désactiver les hooks) ?
```
