# Security — NEXTVIEW TRADE

## Principles

1. The backend is authoritative for all financial state.
2. Never trust client-submitted balances, prices, P&L, order status, or account state.
3. All external input is validated with Zod.
4. Row Level Security (RLS) is mandatory for user-owned tables.
5. No service-role credentials ever reach the frontend.

## Authentication

- Supabase Auth issues JWTs; the framework issues are signed and user-bound.
- The Next.js `middleware.ts` calls `supabase.auth.getUser()` (server-side JWT
  validation) before an authenticated page is rendered, and refreshes session
  cookies on every protected request.
- The Fastify API verifies the bearer JWT on every authenticated route
  (`plugins/auth.ts`) via Supabase Auth's `getUser`, and attaches the verified
  identity as `request.user`. Tokens are never trusted from cookie payloads or
  client claims.
- Session persistence: `@supabase/ssr` stores the session in cookies for both
  browser and server clients; auto-refresh keeps the session alive.

## Authorization & IDOR Protection

- The user id always comes from the verified JWT (`request.user.id`) and is
  never read from query/body/path input.
- Reads are scoped by `user_id` against the service role (Fastify side) and by
  `auth.uid()` (database side). Two independent enforcement layers.
- No endpoint accepts another user's id/account id, so IDOR is impossible at
  the API boundary. Audit events are scoped to the authenticated user as well.

## Row Level Security

Enabled on all user-owned tables in `0002_rls_policies.sql`:

- Own-row SELECT / UPDATE policies on profiles, trading_accounts, balances,
  ledger_entries, transactions, orders, trades, positions, deposits,
  withdrawals, notifications, watchlists, watchlist_items.
- `audit_logs` deliberately has NO policies — unreachable by anon/authenticated.
- Market data (assets, market_prices, market_candles) is public-SELECT only.

## Input Validation

- API requests validated with Zod (`lib/validation.ts` → `VALIDATION_ERROR`).
- Query strings validated too (e.g. `/api/account/balances?currency=USD`).
- Unknown/additional fields rejected by the schema.

## Transport & Headers

- CORS is locked to `FRONTEND_ORIGIN` (comma-separated allow-list). Requests
  with a disallowed `Origin` header are rejected with `403 FORBIDDEN`.
- Helmet sets secure HTTP headers.
- Rate limiting: 100 requests / minute per IP (tunable in `app.ts`).

## Error Contract

Every failure returns `{ error: { code, message, details? } }`:

- `UNAUTHORIZED` (401) — missing/invalid bearer token
- `FORBIDDEN` (403) — disallowed origin
- `NOT_FOUND` (404) — unknown route or unprovisioned account
- `VALIDATION_ERROR` (400) — Zod rejection (details = flattened field errors)
- `CONFLICT` (409) — reserved
- `INTERNAL` (500) — anything else; real details are logged server-side only

## Financial Integrity

- Money is `NUMERIC` in PostgreSQL, never floats.
- Provisioning, and later order execution, are atomic (single transaction).
- `ledger_entries` is append-only; every balance change leaves a trail.
- Orders carry `idempotency_key` to prevent duplicate execution (Phase 2).
- The initial $100,000.00 paper balance is granted exclusively by the database
  provisioning trigger — no code path lets a client request funds.

## Provisioning & Security

- `handle_new_user()` is a SECURITY DEFINER trigger on `auth.users`: runs with
  `search_path = public`, single transaction, no client involvement possible.
- Duplicate provisioning raises `unique_violation` and rolls back.
- Direct execution of `handle_new_user()`, `sync_profile_email()` and
  `log_auth_user_event()` by `anon`/`authenticated` is denied via
  `REVOKE EXECUTE` (hardened in `0004_reconcile_existing.sql`).
- The existing production 47-policy RLS inventory is authoritative; no policy
  reset was performed by `0004`. Policy changes require a reviewed diff of
  the full inventory.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` is backend-only, defined in `apps/api/.env.local`.
- `.env*` files are git-ignored; `.env*.example` files document names only.
- No hardcoded secrets in code; server logs never include tokens or passwords.
- The API fails fast at boot (`config/env.ts`) when required env vars are absent.

## Audit Logging

Sensitive operations log actor, action, entity type + id, and timestamp:

- registration, login, password-reset request → DB triggers
- logout → `POST /api/auth/logout` (Fastify), forwarded to `audit_logs`
- Stored in `audit_logs`; never exposed to clients (no RLS policy).