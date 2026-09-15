# Development — NEXTVIEW TRADE

## Prerequisites

- Node.js 20+
- pnpm 9+

## Install

```bash
corepack enable pnpm   # or: npm i -g pnpm@9
pnpm install
```

## Environment Setup

Copy the example env files and fill in values:

```bash
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.local.example apps/api/.env.local
```

### Frontend (`apps/web/.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

### Backend (`apps/api/.env.local`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `SUPABASE_ANON_KEY`
- `FRONTEND_ORIGIN` (comma-separated CORS allow-list, default `http://localhost:3000`)
- `PORT` (default 3001)
- `MARKET_DATA_PROVIDER` (default `mock`)

## Supabase

The database is managed by Supabase (cloud or local CLI). Migrations live in
`supabase/migrations/`:

```bash
supabase start        # local stack (config in supabase/config.toml)
supabase migration up # apply 0001/0002/0003 to the local database
```

Deployment: run the migrations against the cloud project (SQL editor), enable
email auth providers, and set the site URL / redirect URLs to the deployed
frontend. Provisioning, RLS, and audit behaviour are fully implemented in the
migrations — no dashboard toggle is required for the core account flow.

Prefer email-password auth: the database triggers assume an `email` column on
`auth.users`.

## Run

```bash
pnpm dev:all      # web (port 3000) + api (port 3001), parallel
# or individually:
pnpm dev          # web only
pnpm dev:api      # api only
```

## Checks

```bash
pnpm typecheck    # type checking across all apps
pnpm lint         # linting across all apps
pnpm test         # tests across all apps
pnpm build        # production build (web)
pnpm build:api    # production build (api)
```

## Workspaces

This is a pnpm monorepo with:

- `apps/web` — Next.js frontend (`@nextview/web`)
- `apps/api` — Fastify backend (`@nextview/api`)

## Git Workflow

- Conventional commits.
- Never commit `.env` files or secrets.
- Run checks before committing.