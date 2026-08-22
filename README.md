# Rapid Response

Frontend Next.js (App Router) du système de gestion de tickets **Rapid Response** — trois rôles (Client, Technicien, Admin), tickets avec machine à états, affectation de techniciens, notifications, statistiques.

Ce repo est **le frontend uniquement**. Le navigateur ne parle jamais directement à la base de données : toutes les données transitent par l'API NestJS du repo backend séparé (`enamya-ticket-checker`).

Pour l'architecture complète, les règles métier par rôle et le guide d'opération détaillé, voir :

- [CLAUDE.md](CLAUDE.md) — guide condensé (commandes, structure, conventions).
- [DOCUMENTATION_PROJET.md](DOCUMENTATION_PROJET.md) — documentation exhaustive (français), source de vérité pour les règles métier.

## Prérequis

- Node.js + [pnpm](https://pnpm.io) (gestionnaire de paquets du projet).
- Le **backend NestJS** (`enamya-ticket-checker`) déjà démarré, généralement sur `http://localhost:4000`.
- Un fichier `.env.local` à la racine avec au minimum :

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=une-valeur-secrete
```

## Démarrage

```bash
pnpm install
pnpm dev          # serveur de dev (webpack)
```

Ouvrir [http://localhost:3000](http://localhost:3000) — l'entrée réelle de l'app est `/login`, puis `/dashboard` une fois connecté (`/` reste la page de démo par défaut de Next.js et n'est pas utilisée).

## Commandes

```bash
pnpm dev          # démarre le serveur de dev (webpack)
pnpm dev:turbo    # démarre le serveur de dev avec Turbopack
pnpm dev:clean    # supprime .next puis pnpm dev
pnpm build        # build de production
pnpm start        # lance le build de production
pnpm lint         # eslint
```

Il n'y a pas de suite de tests dans ce repo.
