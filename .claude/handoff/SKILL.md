---
name: handoff
description: >-
  Produit un rapport de fin de session horodaté : objectif de la session, tentatives échouées
  (avec causes), tentatives réussies (avec pourquoi elles ont marché), et prochaines étapes.
  Sauvegarde le rapport dans .claude/handoffs/ du projet courant pour relecture lors des
  sessions suivantes. Déclencher en fin de session ou avant une longue pause.
  Mots-clés: handoff, fin de session, résumé, recap, bilan, prochaines étapes, next steps.
---

# handoff

Génère un **rapport de passation de session** structuré, horodaté, persisté sur disque.
Le fichier produit est lisible à la prochaine session pour reprendre sans perte de contexte.

## Objectif

Capturer fidèlement — en une seule passe — tout ce qui s'est passé dans la session courante :
ce qu'on cherchait, ce qui a bloqué, ce qui a fonctionné, et où aller ensuite.

## Étapes d'exécution

### Étape 1 — Collecter le contexte de session

Analyser **l'intégralité de la conversation** pour extraire :

- **Objectif principal** : ce que l'utilisateur voulait accomplir dans cette session (1–3 phrases max).
- **Tentatives échouées** : chaque approche qui n'a pas abouti, avec la cause d'échec identifiée.
- **Tentatives réussies** : chaque approche qui a fonctionné, avec l'explication du pourquoi.
- **Prochaines étapes** : liste actionnable de ce qui reste à faire (au moins 3 items si possible).

### Étape 2 — Vérifier / créer le dossier de destination

Le rapport est toujours sauvegardé dans le projet courant :

```
<working_directory>/.claude/handoffs/
```

Si `.claude/handoffs/` n'existe pas, le créer avec `mkdir -p`.

### Étape 3 — Générer le fichier de rapport

Nom du fichier : `handoff-YYYY-MM-DD_HH-MM.md` (timestamp UTC au moment de l'exécution).

Le rapport suit ce template **exactement** :

```markdown
# Handoff — YYYY-MM-DD HH:MM UTC

## Objectif de la session

<résumé concis de ce que l'utilisateur voulait accomplir>

## Tentatives échouées

| # | Approche | Cause de l'échec |
|---|----------|-----------------|
| 1 | <description> | <pourquoi ça n'a pas marché> |
| 2 | ... | ... |

> Aucune tentative échouée si la session s'est déroulée sans blocage.

## Tentatives réussies

| # | Approche | Pourquoi ça a marché |
|---|----------|---------------------|
| 1 | <description> | <explication du succès> |
| 2 | ... | ... |

## Prochaines étapes

- [ ] <étape 1 — précise et actionnable>
- [ ] <étape 2>
- [ ] <étape 3>
- [ ] ...

## Notes additionnelles

<décisions prises, contraintes découvertes, points d'attention pour la prochaine session — optionnel>
```

### Étape 4 — Mettre à jour l'index

Mettre à jour (ou créer) `.claude/handoffs/INDEX.md` avec une ligne pour ce rapport :

```markdown
| Date | Fichier | Objectif résumé |
|------|---------|-----------------|
| YYYY-MM-DD HH:MM | [handoff-YYYY-MM-DD_HH-MM.md](handoff-YYYY-MM-DD_HH-MM.md) | <objectif en 10 mots max> |
```

L'index est en ordre chronologique décroissant (plus récent en premier).

### Étape 5 — Confirmer à l'utilisateur

Afficher :
- Le chemin absolu du fichier créé.
- Un extrait des prochaines étapes (les 3 premières).
- Comment relire ce handoff en début de prochaine session.

## Règles

- **Fidélité > exhaustivité** : ne rien inventer. Si une info est absente de la conversation, omettre plutôt qu'halluciner.
- **Horodatage UTC** : toujours utiliser l'heure UTC pour les timestamps. L'heure locale peut être mentionnée entre parenthèses si connue.
- **Langue** : rapport en français (même règle que le projet courant). Code et chemins en anglais.
- **Ton** : factuel, sans jugement, sans sur-vendre les succès ni dramatiser les échecs.
- **Idempotent** : si `/handoff` est relancé dans la même minute, écraser le fichier existant plutôt qu'en créer un doublon.

## Comment relire un handoff en début de session

Au démarrage d'une nouvelle session, l'utilisateur peut dire :
> "Lis le dernier handoff"

→ Lire `.claude/handoffs/INDEX.md`, ouvrir le fichier le plus récent, et résumer les prochaines étapes en 3–5 lignes avant de commencer.
