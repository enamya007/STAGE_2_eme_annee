---
name: api-forge
description: >-
  Génère la couche d'accès API d'un projet frontend (React/Next ou Angular) à partir d'une collection
  OpenAPI/Swagger, Postman, ou d'une URL de spec : services d'appel (axios/fetch pour React,
  HttpClient/Observable pour Angular), modèles TypeScript, schémas de validation (valibot ou zod
  selon l'installé) avec types inférés, et query keys + hooks/inject* TanStack Query si présent.
  Utiliser quand l'utilisateur a une collection API (fichier ou URL) et veut générer rapidement
  services/models/schemas corrects, éditables et re-générables. Mots-clés: openapi, swagger, postman,
  axios, fetch, angular, httpclient, valibot, zod, tanstack query, api client, generate services,
  models, schemas, query keys.
---

# api-forge

Transforme une **collection API** en couche d'accès aux données complète et idiomatique :
`services/` (appels), `types/` (modèles), `schema/` (validation valibot/zod + types inférés),
et `keys/` + `hooks/` (TanStack Query) — le tout aligné sur la stack et les conventions **déjà**
présentes dans le projet, **non destructif** et **re-générable**.

Promesse : « j'ai ma collection API → je génère vite une couche correcte du premier coup, et je
peux repasser éditer à ma guise. »

## Principe de robustesse

Le format source (OpenAPI / Swagger / Postman) est d'abord **normalisé en un manifeste pivot**
déterministe par un script Node, puis **revu par le LLM** pour la conformité. La génération ne lit
que le manifeste → indépendante du format, peu sujette à l'hallucination.

```
collection (json/yaml/url) ──script──▶ manifest.json ──revue LLM──▶ génération ──▶ services/types/schema/keys
```

## Quand l'utiliser

- L'utilisateur fournit un fichier OpenAPI/Swagger (JSON ou YAML) ou un export Postman.
- L'utilisateur donne une URL de spec (`/api-docs`, `/swagger-json`, `openapi.json`).
- L'utilisateur veut (re)générer services/models/schemas pour des ressources de son API.

## Fichiers du skill

- `scripts/normalize-collection.mjs` — normaliseur OpenAPI 3 / Swagger 2 / Postman 2.1 → manifeste.
- `references/manifest-schema.md` — contrat du manifeste (le langage pivot).
- `references/stack-detection.md` — comment détecter HTTP client / validation / query / framework.
- `references/conventions.md` — layout, nommage, responsabilité des fichiers, non-destructif.
- `references/generation-react.md` — **table de correspondance** manifeste → TS / valibot / zod / hooks.
  Les §1–§5 (TypeNode → type TS, → valibot/zod, messages d'erreur, pagination) sont **partagés** par
  toutes les cibles ; seuls service/query/http diffèrent par framework.
- `references/generation-angular.md` — partie **spécifique Angular** : service `HttpClient`/`Observable`,
  interceptors, couche query `injectQuery`/`injectMutation`, keys. Réutilise generation-react.md §1–§5.
- `assets/templates/*.tmpl` — squelettes de fichiers. React : `http-axios`, `http-fetch`, `service`,
  `schema-*`, `types`, `query-keys`, `query-hooks`. Angular : `service-angular`, `query-keys-angular`,
  `query-inject-angular`, `http-interceptors-angular`.

Charger ces références au moment où chaque étape en a besoin (progressive disclosure) ; ne pas tout
lire d'avance.

---

## Workflow

### Étape 0 — Détecter la stack et les conventions

Lire `package.json`, le lockfile, `tsconfig.json`, `.env.example` (ou `src/environments/` en Angular),
et scanner l'arborescence du code. Appliquer `references/stack-detection.md` +
`references/conventions.md` pour décider.

**Détecter d'abord le framework** (`stack-detection.md` §4) — il commande tout le reste :

- `@angular/core` présent → **cible Angular** : client = `HttpClient` (Observable), couche query =
  `@tanstack/angular-query-experimental` (`inject*`), baseURL via `environment.apiUrl`. Suivre
  `stack-detection.md` §8 + `generation-angular.md`. Sauter toute la logique axios/fetch.
- sinon → **cible React/Next** : client HTTP (axios par défaut, sinon fetch), TanStack react-query
  (hooks), baseURL via variable d'env.

Puis décider : librairie de validation (valibot vs zod ; demander si ambigu), présence de TanStack
Query, alias d'import, gestionnaire de paquets, **et dossiers/style déjà en place à réutiliser**.

**Déclaration des modèles — `type` par défaut.** Générer les modèles `types/` en **`type` alias**.
N'utiliser `interface` que si l'utilisateur le demande explicitement, ou si les modèles existants du
projet sont déjà en `interface` (épouser la convention de l'hôte). Détecter ce style en scannant
`types/`/`models/`. Détails : `references/generation-react.md` §1.

**Instance HTTP — vérifier l'existant avant de créer (important).** Ne pas se contenter de regarder
si axios est *installé* : chercher dans le code (Grep `axios.create(`, `export default`/`export const`
http|api|client, factory `createXxxApi`, wrapper fetch, `ky.create`) une **instance/wrapper déjà
configuré** (souvent dans `src/libs/api/`, `src/lib/`, `src/services/http*`). Si elle existe →
**la réutiliser** (importer depuis son chemin réel, adapter l'import default/nommé et le déballage
`.then(r => r.data)` selon sa forme), ne PAS générer de nouvelle instance ni réécrire ses
intercepteurs (auth/refresh). Gérer le cas d'une instance **client** + une factory **serveur**
distinctes. Détails et table de décision : `references/stack-detection.md` §1b.

Présenter un récap concis de la stack détectée — **dont l'instance HTTP réutilisée (chemin + forme)
ou à créer** — et **laisser l'utilisateur surcharger** (forcer zod, ajouter axios, désactiver les
hooks, etc.) avant de continuer.

### Étape 1 — Acquérir la collection

- **Fichier** : demander/confirmer le chemin (OpenAPI/Swagger JSON **ou YAML**, Postman JSON).
- **URL** : récupérer la spec via WebFetch ou `curl`/`Invoke-WebRequest` et l'enregistrer en local.
- **YAML** → convertir en JSON d'abord : réutiliser `js-yaml`/`yaml` du projet s'il est installé,
  sinon `npx -y js-yaml <file>`, sinon lire le YAML et le réémettre en JSON. Le script n'accepte
  que du JSON.

Si l'utilisateur n'a encore rien fourni, lui demander la source (chemin de fichier ou URL).

### Étape 2 — Normaliser (script)

Exécuter, depuis le dossier du skill, avec un chemin de sortie dans le projet ou un tmp :

```
node scripts/normalize-collection.mjs <input.json> --out <manifest.json>
```

Le script imprime sur stderr un récap `format / ressources / endpoints / schémas`. Lire le
manifeste produit. En cas de format non reconnu, vérifier l'entrée (cf. `references/manifest-schema.md`).

### Étape 3 — Revue LLM de conformité (ne pas sauter)

Relire le manifeste **contre la collection brute** et patcher les cas que le script aplatit
(listés dans `references/manifest-schema.md` § Limites) : unions discriminées, `allOf` profonds,
formats spéciaux, enums imbriqués, `type:["x","null"]`, nullable vs optional, réponses paginées
(repérer l'enveloppe `{ data, meta }`), et — pour Postman — champs faussement « requis » déduits
d'exemples partiels. Corriger le manifeste avant de générer.

### Étape 4 — Plan de génération (dry-run validé)

Proposer à l'utilisateur, **avant d'écrire** :
- les dossiers cibles (ajustés aux conventions détectées),
- le regroupement par ressource et la liste « N ressources × M fichiers »,
- la variable d'env de baseURL retenue,
- la convention de nommage,
- les options : générer les schémas de réponse ou non, mode « source unique type/schéma » (cf.
  `conventions.md` §5), générer les hooks TanStack ou non.

Laisser l'utilisateur ajuster (sous-ensemble de ressources, renommer, etc.).

### Étape 5 — Générer

Appliquer **strictement** la table de correspondance. Le mapping type/schéma (`generation-react.md`
§1–§5) est **commun aux deux cibles**. Pour le service, la couche query et le client HTTP : suivre
`generation-react.md` §6–§8 en React, ou **`generation-angular.md`** en Angular. Partir des
`assets/templates/*.tmpl` (variantes `*-angular.tmpl` pour Angular). Remplir réellement chaque
propriété/contrainte depuis le manifeste — les templates sont des squelettes, pas le livrable.

Ordre suggéré (**React/Next**) :
1. **Client HTTP partagé** : si une instance/wrapper existe déjà (étape 0 / `stack-detection.md` §1b),
   **ne rien créer** — les services importeront l'instance existante. Sinon seulement, générer
   `services/http/axios.ts` ou `services/http/fetch.ts`. Générer `keys/index.ts` si TanStack et absent.
2. **Par ressource** : `types/<r>.ts` → `schema/<r>.schema.ts` → `services/<r>.service.ts` →
   (si TanStack) `keys/<r>.keys.ts` + `hooks/use<R>.ts`.

Ordre suggéré (**Angular**, cf. `generation-angular.md`) :
1. **Transverse** : ne PAS créer d'instance HTTP (c'est `HttpClient`). Si l'utilisateur veut des
   interceptors (auth / strip-empty-params) et qu'aucun n'existe → générer `interceptors/*.ts` et
   rappeler de les enregistrer dans `provideHttpClient(withInterceptors([...]))`.
2. **Par ressource** : `types/<r>.type.ts` → `schemas/<r>.schema.ts` → `services/<r>.service.ts`
   (`@Injectable`, `HttpClient`, `Observable<T>`) → (si TanStack) `keys/<r>.key.ts` +
   (si couche query choisie) `queries/<r>.query.ts` (fonctions `inject*`).

Contraintes de qualité :
- Honorer **toutes** les contraintes du manifeste (required/nullable/enum/format/min/max…).
- **Chaque règle de schéma porte un message d'erreur FR par champ** (jamais le message par défaut
  de la lib) : string requis → « Le {champ} est requis », etc. Suivre le catalogue et le placement
  exact (valibot/zod, version) de `generation-react.md` §1bis. Si le projet a une i18n, suivre sa
  locale par défaut (ou proposer des clés de traduction).
- Réutiliser les `ref` (un schéma/type nommé = un fichier importé, pas de duplication).
- Respecter le style du projet (imports groupés, `import type`, optional chaining, Prettier).
- Sous Next App Router, les fichiers de hooks commencent par `'use client'`.


### Étape 6 — Vérifier et rendre la main

- Lancer la vérification de types du projet (`tsc --noEmit` ou le script `lint`/`typecheck`
  disponible) sur les fichiers générés ; corriger les erreurs de type.
- Lancer `lint:fix`/`format` du projet si présents.
- **Non destructif** : pour tout fichier cible déjà existant, montrer le diff et demander avant
  d'écraser. Ne jamais perdre du code édité à la main. Les fichiers partagés (http, keys/index)
  ne sont pas réécrits s'ils existent.
- Récapituler ce qui a été créé/modifié et rappeler que tout est éditable et re-générable.

## Règles transverses

- En cas d'ambiguïté de stack ou de convention → **demander**, ne pas deviner silencieusement.
- Ne pas supprimer de dossier sans avoir demander l'autoraisation au préalable
- Ne pas modifier de dossiers protégés (ex. templates Vuexy `@core`/`@menu`/`@layouts`) : générer
  dans `services/`, `types/`, `schema(s)/`, `keys/`, `hooks/` ou `queries/`.
- Portée : **React/Next** (axios/fetch + react-query) et **Angular** (HttpClient/RxJS +
  angular-query-experimental). Le framework est détecté à l'étape 0 et commande le choix des
  templates et de la table de génération (`generation-react.md` vs `generation-angular.md`).

## Working with Claude (conventions de collaboration)


- **Contexte** : développeur en stage, encore en apprentissage de ce codebase. Avant d'écrire du code sur une feature pas encore maîtrisée, explique brièvement le "pourquoi" (quel pattern du projet ça suit, pourquoi ce choix) avant le "comment".
- **Ne jamais deviner un contrat d'API.** Si un endpoint, un DTO, ou la forme exacte d'une réponse n'est pas confirmé dans le code existant (service, réponse Swagger, ou exemple déjà présent dans `src/services/`), demander de vérifier avant d'écrire le service/hook correspondant plutôt que de supposer.
- **Respecter les conventions déjà documentées plus haut dans ce fichier** plutôt que d'introduire une nouvelle librairie ou un nouveau pattern (ex. ne pas proposer Zod puisque valibot est déjà en place, ne pas ajouter un state manager de plus puisque Redux/Zustand couvrent déjà le besoin — voir "State" ci-dessus).
- **Périmètre des changements** : proposer des diffs aussi restreints que possible ; ne pas toucher `@core`/`@layouts`/`@menu` sauf demande explicite de personnalisation du shell (déjà noté ci-dessus, on insiste).
- **Avant de considérer une tâche terminée** : rappeler de lancer `pnpm lint:fix`.
- **Tests** : rappel — pas de suite de tests dans ce repo (déjà noté plus haut), ne pas en écrire ni en exécuter sauf demande explicite.
- **Commandes qui modifient l'état** (commit, push, migrations, appels réseau non-idempotents) : toujours demander confirmation avant d'exécuter, ne jamais enchaîner automatiquement.

