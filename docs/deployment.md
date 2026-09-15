# Deployment — NEXTVIEW TRADE

Targets:

| Component | Platform |
|-----------|----------|
| Frontend (`apps/web`) | Vercel |
| Backend (`apps/api`) | Railway |
| Database / Auth | Supabase |

## Database & Auth (Supabase)

1. Create a Supabase project.
2. **For a brand-new project (no schema):** apply the migration files in
   `supabase/migrations/0001..0003` (SQL editor, in order). These create the
   schema, RLS policies, seed assets, and the provisioning/audit triggers.
3. **For the existing production database:** apply **only**
   `supabase/migrations/0004_reconcile_existing.sql` (SQL editor, single
   transaction). This repairs the provisioning function, hardens EXECUTE
   privileges and asserts invariants — **do not** re-apply 0001/0002/0003.
4. Enable email-password auth (email confirmations recommended). Set `Site URL`
   and redirect URLs to the deployed frontend (e.g. `https://app.example.com`)
   and ensure `http://localhost:3000` is allowed for local development — the
   password-reset flow redirects to `/update-password`.
5. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> Managing a local stack: `supabase start` (see `supabase/config.toml`) and
> `supabase migration up` reproduce the same schema locally.

## Frontend (Vercel)

1. Import the repo in Vercel.
2. Root directory: `apps/web`
3. Framework: Next.js (auto-detected)
4. Build command: `pnpm --filter @nextview/web build`
5. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` — point to the Railway backend URL

## Backend (Railway)

1. Add a new service from the repo.
2. Root directory: `apps/api`
3. Start command: `node dist/server.js`
4. Build: `pnpm --filter @nextview/api build`
5. Environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `SUPABASE_ANON_KEY`
   - `FRONTEND_ORIGIN` — comma-separated allow-list, e.g. `https://app.example.com`
   - `PORT` — Railway injects `$PORT`; ensure the server honors it
   - `MARKET_DATA_PROVIDER`

## Contributing Notes

- The frontend and backend are independently deployable.
- `NEXT_PUBLIC_*` variables are safe for the browser.
- Service role keys must never be set in frontend env vars.