# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the **frontend only** ("Rapid Response") of a two-repo system:

| Repo | Role |
| --- | --- |
| This repo (`STAGE_2_eme_annee`) | Next.js 16 App Router frontend |
| `D:\STAGE\APK_\backend\enamya-ticket-checker` (separate repo, not here) | NestJS backend API |

The browser never talks to PostgreSQL — only to the NestJS API at `NEXT_PUBLIC_API_URL` (typically `http://localhost:4000/api`). **Do not modify the backend repo unless explicitly asked.**

The full architecture write-up lives in [DOCUMENTATION_PROJET.md](DOCUMENTATION_PROJET.md) (French) — read it for anything not covered below, especially section 16 (backend internals) and section 3 (business rules per role). This CLAUDE.md is a condensed operating guide; DOCUMENTATION_PROJET.md is the source of truth for business rules.

## Commands

```bash
pnpm dev          # start dev server (webpack), needs backend running on :4000
pnpm dev:turbo    # start dev server with Turbopack instead
pnpm dev:clean    # wipe .next then pnpm dev
pnpm build        # production build
pnpm start        # run production build
pnpm lint         # eslint
```

There is no test suite in this repo. Requires the backend (`enamya-ticket-checker`) already running, and `.env.local` set with `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

## Architecture

### Resource layering (follow this order when adding a new API resource)

```
src/types/*.ts            → response shapes (User, Ticket, ...)
src/schema/*.ts            → Valibot schemas for request bodies (validated before send)
src/services/*.service.ts  → HTTP calls via the shared Axios instance, v.parse() before sending
src/keys/*.keys.ts         → TanStack Query key factories
src/hooks/use*.ts          → useQuery/useMutation wrapping the service
```
Then wire the hook into a page under `src/app/`. This stack was originally generated from OpenAPI (api-forge) and is now maintained by hand — `openapi.raw.json` at the repo root is a stale reference copy, **not read at runtime**.

### Auth flow

- **NextAuth v4 (Credentials provider)**, not NextAuth's own session store for API calls: `src/lib/auth.ts` `authorize()` calls the backend's `/auth/login` and stuffs `accessToken`, `refreshToken`, `role` into the NextAuth JWT.
- `src/components/SessionTokenSync.tsx` copies those tokens out of the NextAuth session into the shared Axios instance (`src/services/http/axios.ts`) in memory.
- Axios attaches `Authorization: Bearer <accessToken>` to every backend request; on a 401 it attempts `POST /auth/refresh` once, then calls `session.update(...)` to persist new tokens, or signs the user out if refresh fails.
- `src/middleware.ts` (matcher: `/dashboard`, `/dashboard/*`) only checks "is there a session" and "is the role ADMIN for an admin-only path" (`src/lib/roles.ts` → `isAdminOnlyPath`/`ADMIN_ONLY_PREFIXES`). It does not call the backend.
- There is no self-service password change and no `PATCH /auth/me` — only forgot/reset-password flows exist for CLIENT/TECHNICIAN. Only ADMIN can update a user via `PATCH /users/:id`.

### Roles and business rules

Three roles come from the backend JWT (`session.user.role`): `ADMIN`, `TECHNICIAN`, `CLIENT`. They gate:
- the sidebar menu (`navKeysForRole` in `src/lib/roles.ts`)
- route access (`src/middleware.ts`)
- which ticket action buttons render (`src/app/dashboard/tickets/[id]/page.tsx`)

Ticket status is **never** a free dropdown — every transition is a dedicated backend endpoint (`assign`, `start`, `resolve`, `reopen`, `close`, `cancel`). The frontend enforces who can see which buttons, but **the backend's state machine is the actual authority** — a visible button can still be rejected with 403/409. See DOCUMENTATION_PROJET.md §3.4 for the full transition table and §16.6 for the backend's XState machine.

Frontend-only business rules not enforced by the backend DTOs (do not "fix" these by loosening validation — the rule is intentional):
- Phone number required at registration/user/technician creation (`src/schema/phone.schema.ts`, 8–30 chars).
- Site/location required when creating a ticket.
- TECHNICIAN accounts are created only via the Techniciens page, never via `/dashboard/utilisateurs`.
- An admin cannot deactivate/delete themselves.

### Two form styles — don't mix them

- **Auth pages** (`login`, `register`, `forgot-password`, `reset-password`): `react-hook-form` + `@hookform/resolvers/valibot` + MUI `TextField` (via `MoonField`). Schemas in `src/features/auth/schemas/`, components in `src/features/auth/components/`.
- **Dashboard pages** (tickets, users, techs, settings): plain `useState` + HTML inputs + Tailwind classes. Valibot validation happens in the service layer at request time, not via a form resolver.

MUI is used for auth screens and providers only (`providers.tsx` ThemeProvider) — it is not the dashboard's design system.

### Path aliases (tsconfig.json)

`@/*` → `src/*`, plus scoped aliases: `@services/*`, `@schema/*`, `@config/*`, `@features/*`, `@types/*`, `@hooks/*`, `@keys/*`, `@lib/*`.

### Directory map

```
src/app/                 Pages (App Router)
  api/auth/[...nextauth]/  NextAuth route
  login, register, forgot-password, reset-password
  dashboard/              Sidebar+topbar layout
    tickets/, tickets/[id]/, techniciens/, utilisateurs/, statistiques/, parametres/
src/components/          RequireRole, SessionTokenSync
src/features/
  auth/                   MUI forms + Valibot schemas
  dashboard/              Sidebar, Topbar, Modal, StatCard
  tickets/                AssignTicketModal, comments, attachments, ticket UI helpers
src/hooks/                TanStack Query hooks
src/keys/                 Query key factories
src/lib/                  auth.ts, logout.ts, roles.ts
src/schema/               Valibot schemas for API request bodies
src/services/             Axios calls per resource, services/http/axios.ts
src/types/                Response types + next-auth.d.ts (session/JWT extension)
```

`src/app/page.tsx` is still the default Next.js scaffold — the real entry point is `/login` then `/dashboard`.

## Things to know before debugging "missing" features

- No global search bar — ticket search/filter lives only on `/dashboard/tickets`.
- No SLA policy UI (backend has the endpoints, no frontend screen).
- No `/dashboard/statistiques` dedicated backend endpoint — stats are computed client-side from `GET /tickets` and `GET /technicians`.
- No WebSocket notifications wired up — the notification bell polls `GET /notifications` / `GET /notifications/unread-count` over HTTP.