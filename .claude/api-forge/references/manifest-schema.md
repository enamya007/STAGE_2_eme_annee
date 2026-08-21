# Manifest schema — le contrat pivot

Le script `normalize-collection.mjs` transforme n'importe quelle collection source
(OpenAPI 3.x, Swagger 2.0, Postman v2.1) en **un seul format normalisé**. Toute la
génération de code lit ce manifeste, jamais la collection brute. C'est ce qui rend le
skill robuste et indépendant du format d'entrée.

## Forme globale

```jsonc
{
  "source": {
    "format": "openapi3 | swagger2 | postman2",
    "title": "string",
    "version": "string",
    "baseUrl": "string"        // peut être vide -> à confronter à l'env du projet
  },
  "schemas": {                 // schémas nommés réutilisables (composants/définitions)
    "<PascalName>": <TypeNode>
  },
  "resources": [               // endpoints groupés par tag (fallback: 1er segment de path)
    {
      "name": "users",         // kebab-case, sert de base de nom de fichier
      "endpoints": [<Endpoint>]
    }
  ],
  "stats": { "resources": 0, "endpoints": 0, "schemas": 0 }
}
```

## Endpoint

```jsonc
{
  "operationId": "createUser",       // camelCase, base du nom de méthode de service
  "method": "get|post|put|patch|delete|head|options",
  "path": "/users/{id}",             // accolades = path params
  "summary": "string",
  "deprecated": false,
  "pathParams":  [<Param>],
  "queryParams": [<Param>],
  "headerParams":[<Param>],
  "requestBody": null | { "required": bool, "contentType": "application/json", "schema": <TypeNode> },
  "response":    { "status": 200, "schema": <TypeNode> }   // schéma de la 1re réponse 2xx
}
```

`Param` = `{ "name": string, "required": bool, "type": <TypeNode>, "description"?: string }`.

## TypeNode

Représentation normalisée d'un type. `kind` indique comment le mapper.

```jsonc
{
  "kind": "object | array | string | number | integer | boolean | enum | ref | union | record | unknown",

  // selon kind :
  "ref": "User",                       // kind=ref  -> référence un schemas[<name>]
  "items": <TypeNode>,                 // kind=array
  "values": <TypeNode>,                // kind=record (dictionnaire { [k]: V })
  "properties": {                      // kind=object
    "<propName>": <TypeNode & {
        "required": bool,
        "nullable"?: bool,
        "readOnly"?: bool,             // côté réponse uniquement -> exclu des schémas d'input
        "writeOnly"?: bool,            // côté requête uniquement -> exclu des types de réponse
        "description"?: string
    }>
  },
  "enum": ["ADMIN", "USER"],           // kind=enum
  "baseType": "string",                // kind=enum : type des valeurs
  "anyOf": [<TypeNode>],               // kind=union (oneOf/anyOf)

  // métadonnées transverses :
  "format": "email|uuid|date-time|date|uri|...",   // alimente les contraintes valibot/zod
  "constraints": {                     // sous-ensemble présent uniquement
    "minLength": 0, "maxLength": 0, "pattern": "regex",
    "minimum": 0, "maximum": 0, "exclusiveMinimum": 0, "exclusiveMaximum": 0, "multipleOf": 0,
    "minItems": 0, "maxItems": 0, "uniqueItems": true
  },
  "nullable": false,
  "default": <any>,
  "description": "string"
}
```

## Règles de lecture pour la génération

- `kind=ref` → réutiliser le type/schéma nommé déjà généré (import), ne pas réinliner.
- `required` est porté par la **propriété** (dans `properties`), pas par le TypeNode cible.
- `nullable` ≠ `!required` : un champ peut être requis ET nullable (`T | null`), ou optionnel et
  non-nullable (`T | undefined`). Mapper les deux axes séparément (voir `generation-react.md`).
- `readOnly` → présent dans le type de **réponse**, absent du schéma de **requête**.
- `writeOnly` → l'inverse.
- `format` + `constraints` → traduits en pipes valibot / chaînes zod (table dans `generation-react.md`).
- Postman n'a pas de schémas formels : `schemas` est vide et les TypeNode sont **inférés** des
  exemples de body/réponse. La passe de revue LLM doit donc être plus attentive sur ces specs.

## Limites connues (à rattraper par la revue LLM — étape 3)

Le script aplatit volontairement certains cas. Après normalisation, **relire la collection brute**
et patcher le manifeste pour :

- `oneOf`/`anyOf` discriminés (unions taggées) — vérifier le discriminant.
- `allOf` profonds / héritages multiples — confirmer la fusion des propriétés.
- Contraintes de `format` non standard (ex. `int64`, `decimal` en string).
- Enums imbriqués dans des sous-objets, énums numériques.
- Champs nullable exprimés en OpenAPI 3.1 via `type: ["string","null"]`.
- Réponses paginées : repérer le wrapper (`{ data, meta, total }`) et le modéliser en générique.
- Postman : exemples partiels (un champ absent d'un exemple n'est pas forcément optionnel).
