# Database Schema — NEXTVIEW TRADE

All monetary values use fixed-precision `NUMERIC` (never floating point):

- USD cash / transaction amounts: `NUMERIC(20, 2)`
- Asset quantities & prices: `NUMERIC(24, 8)`
- Price change percentages: `NUMERIC(12, 6)`

The schema, Row Level Security, and database-authoritative provisioning live in
[`supabase/migrations/`](../supabase/migrations/):

| File | Contents |
| --- | --- |
| `0001_initial_schema.sql` | Tables, indexes, grants, seed universe — **FRESH INSTALL ONLY, not run against the existing production DB** |
| `0002_rls_policies.sql` | RLS enabled + ownership policies — **FRESH INSTALL ONLY** |
| `0003_provisioning.sql` | `handle_new_user()` trigger, auth audit triggers — **FRESH INSTALL ONLY** |
| `0004_reconcile_existing.sql` | Repairs schema-stale provisioning function, EXECUTE hardening, idempotent guards — **apply this on the existing production DB** |

## Tables

### profiles
- id (UUID, PK, FK → auth.users.id, ON DELETE CASCADE)
- email (TEXT)
- display_name (TEXT), first_name, last_name, avatar_url, phone, country,
  timezone, currency (nullable — not required by the application)
- created_at / updated_at (TIMESTAMPTZ)

### trading_accounts
- id (UUID, PK)
- user_id (UUID, FK → profiles.id)
- account_type (TEXT, `'paper'`)
- account_status — **ENUM `account_status`**: `ACTIVE`, `SUSPENDED`, `CLOSED`
- account_name, base_currency, initial_virtual_balance (nullable helper
  columns; written by the provisioning trigger)
- Unique partial index `trading_accounts_one_paper_per_user` on
  `(user_id) WHERE account_type = 'paper'` — duplicate-provisioning guard.
- created_at / updated_at (TIMESTAMPTZ)

### assets
- id (UUID, PK), symbol (TEXT, UNIQUE), name, asset_type — **ENUM `asset_type`**:
  `STOCK`, `CRYPTO`, `ETF`, `FOREX`, `INDEX`, `COMMODITY` — exchange, is_active,
  created_at / updated_at.
- Seeded with the 10 symbols matching the frontend universe:
  BTC/USD, ETH/USD, SOL/USD, AAPL, MSFT, NVDA, TSLA, AMZN, SPY, QQQ.

### market_prices / market_candles
- Latest snapshot per asset (`market_prices`, UNIQUE asset_id) and OHLCV bars
  (`market_candles`, UNIQUE asset_id+timeframe+open_time).
- Public read via RLS; writes are service-role only (Phase 2 market data).

### balances
- id, account_id (FK → trading_accounts.id), currency ('USD')
- available (NUMERIC(20,2), >= 0), reserved (NUMERIC(20,2), >= 0)
- UNIQUE (account_id, currency), updated_at
- Authoritative cash state. The client only ever reads it.

### orders / trades / positions
- Foundational storage for the trading engine (Phase 2). Writes are
  service-role only today; clients read their own via RLS.
- `orders.idempotency_key` is UNIQUE where not null.

### ledger_entries
- Append-only money trail. entry_type — **ENUM `ledger_type`**: `INITIAL_FUNDING`,
  `TRADE_BUY`, `TRADE_SELL`, `TRADING_FEE`, `DEPOSIT`, `WITHDRAWAL`, `ADJUSTMENT` —
  amount, balance_after, reference_id/reference_type, description, created_at.
- Clients may SELECT their own; INSERT/UPDATE/DELETE are service-role only.

### transactions
- User-facing activity feed. transaction_type — **ENUM `transaction_type`**:
  `TRADE`, `FEE`, `DEPOSIT`, `WITHDRAWAL`, `ADJUSTMENT` (no INITIAL_FUNDING member;
  the initial-funding ledger event is surfaced in the feed as `DEPOSIT`).
  status — **ENUM `transaction_status`**: `PENDING`, `COMPLETED`, `FAILED`,
  `CANCELLED`. Read-only to the owner.

### watchlists / watchlist_items
- Full owner CRUD. `watchlist_items.position` orders items within a list.
- Every user receives a default "Default" watchlist at provisioning.

### deposits / withdrawals
- Schema foundation for Phase 3 funding flows (status workflow columns
  included). Read-only to the owner for now.

### audit_logs
- Immutable security trail. **No RLS policies exist** — only the service role /
  SECURITY DEFINER triggers can touch it. Rows: user_id, actor_type
  ('user'/'system'/'service'), action, entity_type, entity_id, details (JSONB),
  ip_address (INET), created_at.
- Written by DB triggers (registration, login, password-reset request) and by
  the Fastify API (`auth.logout`).

### notifications
- user_id, title, message, notification_type, is_read, read_at, created_at.
- Owners select + mark-read their own; inserts come from the provisioning
  trigger / backend.

## Row Level Security

RLS is enabled on every public-schema table. Policies in `0002_rls_policies.sql`:

- `assets`, `market_prices`, `market_candles`: SELECT for anon + authenticated.
- User-owned tables (profiles, trading_accounts, balances, ledger_entries,
  transactions, orders, trades, positions, deposits, withdrawals): SELECT only
  for the owner (`auth.uid()`), scoped through `trading_accounts.user_id`.
- watchlists / watchlist_items: full owner CRUD.
- notifications: owner SELECT + UPDATE (mark read).
- audit_logs: NO policies → zero rows reachable by anon/authenticated.

## Provisioning

The `public.handle_new_user()` SECURITY DEFINER trigger runs on
`INSERT INTO auth.users` inside the **same transaction**:

1. insert profile (display name from `raw_user_meta_data.display_name`)
2. insert paper `trading_account` (`account_status = 'ACTIVE'`)
3. insert `balances` row: `USD` available `100000.00`, reserved `0.00`
4. insert initial-funding `ledger_entries` row (`entry_type = 'INITIAL_FUNDING'`)
5. insert `transactions` row (`transaction_type = 'DEPOSIT'` — surfaced in the
   feed as the onboarding funding event; the ledger carries the authoritative
   `INITIAL_FUNDING` record)
6. insert default `watchlists` row
7. insert welcome `notifications` row
8. insert `auth.registration` audit row

Because it is a trigger, no client, API route, or service-role code can choose
the amounts or create a half-provisioned account. If any statement fails the
whole `auth.users` insert rolls back. Re-running raises a `unique_violation`
(duplicate-protection).

Auth audit triggers also watch `auth.users`:

- `last_sign_in_at` changes → `auth.login` audit event
- `recovery_sent_at` changes → `auth.password_reset_requested` audit event
- `email` changes → profile email kept in sync