# Conventions — layout, nommage, responsabilités

Règle d'or : **épouser les conventions existantes du projet hôte** avant d'appliquer celles par
défaut ci-dessous. Le skill détecte ce qui existe et s'y aligne ; il n'impose une structure que sur
un projet vierge.

## 1. Détecter l'existant d'abord

Scanner `src/` (ou la racine du code) pour :

| On cherche                    | Si présent → réutiliser tel quel                          |
| ----------------------------- | --------------------------------------------------------- |
| `src/services/`               | y poser les services + `services/http/`                   |
| `src/types/` ou `src/types/api/` | y poser les modèles (respecter un éventuel sous-dossier `api/`) |
| `src/schema/` ou `src/schemas/` | y poser les schémas de validation (garder le pluriel/singulier existant) |
| `src/lib/` ou `src/libs/`     | emplacement alternatif fréquent pour l'instance HTTP      |
| `src/hooks/`                  | y poser les hooks TanStack                                |
| `src/api/`                    | certains projets centralisent tout ici — s'y conformer    |

Repérer aussi le **style de nommage de fichier** déjà utilisé (ex. `notice.ts` vs `notice.service.ts`
vs `NoticeService.ts`) et le reproduire.

## 2. Layout par défaut (projet vierge)

```
src/
├── services/
│   ├── http/
│   │   └── axios.ts            # (ou fetch.ts) instance partagée, intercepteurs
│   └── <resource>.service.ts   # un service par ressource
├── types/
│   └── <resource>.ts           # types requête + réponse (modèles purs, `type` par défaut)
├── schema/
│   └── <resource>.schema.ts    # schémas valibot/zod + types inférés
├── keys/                       # uniquement si TanStack
│   ├── index.ts
│   └── <resource>.keys.ts      # query key factory
└── hooks/                      # uniquement si TanStack
    └── use<Resource>.ts        # useQuery / useMutation
```

> NB plan initial : « -types », « -schema ». Concrètement on génère des **dossiers** `types/`,
> `schema/`, `services/`, `keys/`. Les **types inférés** des schémas sont exportés depuis les
> fichiers `schema/` (source de vérité runtime) ; `types/` contient les modèles purs (réponses,
> entités). Si une seule source de vérité est préférée, voir §5.

### Layout Angular (quand `@angular/core` est détecté)

Cible Angular → structure et suffixes différents (sous `src/app/`). Détails :
`generation-angular.md` §1. Épouser d'abord les conventions de l'hôte.

```
src/app/
├── services/    <resource>.service.ts   # @Injectable, HttpClient, Observable<T>
├── types/       <resource>.type.ts      # modèles purs (type alias par défaut)
├── schemas/     <resource>.schema.ts    # valibot/zod + types inférés (dossier au pluriel)
├── keys/        <resource>.key.ts       # query key factory (suffixe .key)
├── queries/     <resource>.query.ts     # fonctions inject* (si couche query choisie)
└── interceptors/                        # (optionnel) auth + strip-empty-params
```

Différences de suffixe vs React : `.type.ts` / `.key.ts` / `.query.ts` (au lieu de `<r>.ts` /
`.keys.ts` / `use<R>.ts`), dossier `schemas/` au pluriel. **Toujours** vérifier le style réel du
projet et le reproduire plutôt que d'imposer ces défauts.

## 3. Responsabilité de chaque fichier

- **`types/<resource>.ts`** — types TypeScript des entités et des réponses (modèles « purs »,
  sans dépendance runtime). Déclarés en **`type` alias par défaut** ; `interface` seulement si
  l'utilisateur le demande ou si le projet en utilise déjà (voir §4). C'est ce qu'on importe partout
  dans l'app pour typer.
- **`schema/<resource>.schema.ts`** — schémas de validation des **entrées** (payloads POST/PUT/PATCH,
  query params contraints). Exporte les types inférés (`InferInput`/`InferOutput` ou `z.infer`) à
  utiliser avec react-hook-form. Les schémas portent **toutes** les contraintes du manifeste.
- **`services/<resource>.service.ts`** — fonctions/méthodes typées d'appel API (une par endpoint),
  via le client HTTP partagé. Valident le payload avec le schéma avant envoi, renvoient des données
  typées (depuis `types/`). Aucune logique UI.
- **`services/http/axios.ts`** (ou `fetch.ts`) — instance unique : baseURL depuis l'env, timeout,
  intercepteurs (auth token, normalisation d'erreur, déballage `data`).
- **`keys/<resource>.keys.ts`** — factory de query keys hiérarchiques, centralisées.
- **`hooks/use<Resource>.ts`** — wrappers TanStack (`useQuery`/`useMutation`) câblant service + keys.

## 4. Nommage

- Fichiers : **kebab-case** (`plan-abonnement.service.ts`), sauf si le projet fait autrement.
- Types/interfaces : **PascalCase** (`PlanAbonnement`, `CreateUserInput`, `UsersListResponse`).
  Modèles déclarés en **`type` alias par défaut** ; n'utiliser `interface` que si l'utilisateur le
  demande ou si l'hôte le fait déjà. Ne pas mélanger les deux styles dans le même projet.
- Schémas : **camelCase** suffixé `Schema` (`createUserSchema`).
- Méthodes de service : `operationId` en camelCase (`listUsers`, `createUser`, `getUserById`).
- Query keys : factory `<resource>Keys` (`usersKeys.list(params)`, `usersKeys.detail(id)`).
- Types inférés : `XxxInput` (payload validé) / `XxxOutput` si transformation.

## 5. Variante « une seule source de vérité » (optionnelle)

Certaines équipes préfèrent **dériver** les types des schémas plutôt que maintenir des interfaces
séparées. Dans ce cas : générer le schéma de la **réponse** aussi dans `schema/`, et faire de
`types/<resource>.ts` un simple ré-export des types inférés (`export type User = InferOutput<typeof userSchema>`).
Proposer cette variante à l'utilisateur s'il veut éviter la duplication type/schéma ; sinon garder
la séparation (types purs sans coût runtime à l'import, schémas seulement pour les entrées).

## 6. Non destructif / re-générable

- Si un fichier cible existe : **montrer le diff** et demander avant d'écraser. Ne jamais effacer du
  code édité à la main.
- Garder les fichiers petits et idiomatiques pour que l'utilisateur puisse repasser éditer.
- Le client HTTP partagé et les `keys/index.ts` ne sont générés **qu'une fois** ; les re-runs les
  laissent intacts s'ils existent déjà.
