-- NEXTVIEW TRADE — 0001_initial_schema
-- Creates the full domain schema. Monetary values use NUMERIC (never float).
-- User-owned tables are protected by RLS in 0002_rls_policies.sql.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- trading_accounts — paper trading accounts (one paper account per user)
-- ---------------------------------------------------------------------------
create table public.trading_accounts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  account_type text not null default 'paper' check (account_type in ('paper')),
  status       text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- compound PK-ish guard: at most one paper account per user
create unique index trading_accounts_one_paper_per_user
  on public.trading_accounts (user_id)
  where account_type = 'paper';

create trigger trading_accounts_updated_at
  before update on public.trading_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- assets — the tradeable universe (10 instruments seeded below)
-- ---------------------------------------------------------------------------
create table public.assets (
  id         uuid primary key default gen_random_uuid(),
  symbol     text not null unique,
  name       text not null,
  asset_type text not null check (asset_type in ('stock', 'etf', 'crypto')),
  exchange   text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger assets_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- market_prices — latest snapshot per asset (public read)
-- ---------------------------------------------------------------------------
create table public.market_prices (
  id              uuid primary key default gen_random_uuid(),
  asset_id        uuid not null references public.assets (id) on delete cascade,
  symbol          text not null,
  price           numeric(24, 8) not null,
  change          numeric(24, 8) not null default 0,
  change_percent  numeric(12, 6) not null default 0,
  open            numeric(24, 8),
  high            numeric(24, 8),
  low             numeric(24, 8),
  previous_close  numeric(24, 8),
  volume          numeric(24, 2),
  last_updated    timestamptz not null default now(),
  unique (asset_id)
);

-- ---------------------------------------------------------------------------
-- market_candles — OHLCV bars per asset/timeframe (public read)
-- ---------------------------------------------------------------------------
create table public.market_candles (
  id        uuid primary key default gen_random_uuid(),
  asset_id  uuid not null references public.assets (id) on delete cascade,
  symbol    text not null,
  timeframe text not null check (timeframe in ('1m', '5m', '15m', '1h', '4h', '1d')),
  open_time timestamptz not null,
  open      numeric(24, 8) not null,
  high      numeric(24, 8) not null,
  low       numeric(24, 8) not null,
  close     numeric(24, 8) not null,
  volume    numeric(24, 2) not null,
  unique (asset_id, timeframe, open_time)
);

-- ---------------------------------------------------------------------------
-- balances — available cash per account/currency (authoritative)
-- ---------------------------------------------------------------------------
create table public.balances (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.trading_accounts (id) on delete cascade,
  currency   text not null default 'USD',
  available  numeric(20, 2) not null default 0 check (available >= 0),
  reserved   numeric(20, 2) not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now(),
  unique (account_id, currency),
  check (reserved >= 0 and available >= 0)
);

create trigger balances_updated_at
  before update on public.balances
  for each row execute function public.set_updated_at();

create index balances_account_idx on public.balances (account_id);

-- ---------------------------------------------------------------------------
-- orders / trades / positions — trading engine storage (Phase 2 logic)
-- Writes are service-role only; clients only ever read their own via RLS.
-- ---------------------------------------------------------------------------
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references public.trading_accounts (id) on delete cascade,
  asset_id         uuid not null references public.assets (id) on delete restrict,
  side             text not null check (side in ('buy', 'sell')),
  order_type       text not null check (order_type in ('market', 'limit')),
  quantity         numeric(24, 8) not null check (quantity > 0),
  limit_price      numeric(24, 8) check (limit_price is null or limit_price > 0),
  status           text not null default 'pending'
                     check (status in ('pending', 'open', 'partially_filled', 'filled', 'cancelled', 'rejected')),
  filled_quantity  numeric(24, 8) not null default 0 check (filled_quantity >= 0),
  average_price    numeric(24, 8),
  idempotency_key  uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index orders_idempotency_key_unique on public.orders (idempotency_key)
  where idempotency_key is not null;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.trades (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete restrict,
  account_id   uuid not null references public.trading_accounts (id) on delete cascade,
  asset_id     uuid not null references public.assets (id) on delete restrict,
  side         text not null check (side in ('buy', 'sell')),
  quantity     numeric(24, 8) not null check (quantity > 0),
  price        numeric(24, 8) not null,
  total_amount numeric(20, 2) not null,
  executed_at  timestamptz not null default now()
);

create index trades_account_idx on public.trades (account_id);

create table public.positions (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.trading_accounts (id) on delete cascade,
  asset_id            uuid not null references public.assets (id) on delete cascade,
  quantity            numeric(24, 8) not null default 0,
  average_entry_price numeric(24, 8),
  updated_at          timestamptz not null default now(),
  unique (account_id, asset_id)
);

create trigger positions_updated_at
  before update on public.positions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ledger_entries — append-only money trail (never client-writable)
-- ---------------------------------------------------------------------------
create table public.ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.trading_accounts (id) on delete cascade,
  entry_type     text not null
                   check (entry_type in ('initial_funding', 'trade_buy', 'trade_sell', 'deposit', 'withdrawal', 'adjustment')),
  amount         numeric(20, 2) not null,
  balance_after  numeric(20, 2) not null,
  reference_id   uuid,
  reference_type text,
  description    text,
  created_at     timestamptz not null default now()
);

create index ledger_entries_account_idx on public.ledger_entries (account_id, created_at desc);

-- ---------------------------------------------------------------------------
-- transactions — user-facing activity feed
-- ---------------------------------------------------------------------------
create table public.transactions (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references public.trading_accounts (id) on delete cascade,
  transaction_type text not null check (transaction_type in ('initial_funding', 'deposit', 'withdrawal', 'trade')),
  amount           numeric(20, 2) not null,
  status           text not null default 'completed',
  description      text,
  reference_id     uuid,
  created_at       timestamptz not null default now()
);

create index transactions_account_idx on public.transactions (account_id, created_at desc);

-- ---------------------------------------------------------------------------
-- watchlists / watchlist_items — user-curated watchlists
-- ---------------------------------------------------------------------------
create table public.watchlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null default 'Default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger watchlists_updated_at
  before update on public.watchlists
  for each row execute function public.set_updated_at();

create table public.watchlist_items (
  id           uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists (id) on delete cascade,
  asset_id     uuid not null references public.assets (id) on delete cascade,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  unique (watchlist_id, asset_id)
);

create index watchlist_items_watchlist_idx on public.watchlist_items (watchlist_id, position);

-- ---------------------------------------------------------------------------
-- deposits / withdrawals — funding flows (Phase 3 logic, schema foundation)
-- ---------------------------------------------------------------------------
create table public.deposits (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.trading_accounts (id) on delete cascade,
  currency   text not null default 'USD',
  amount     numeric(20, 2) not null check (amount > 0),
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  provider   text,
  reference  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger deposits_updated_at
  before update on public.deposits
  for each row execute function public.set_updated_at();

create table public.withdrawals (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.trading_accounts (id) on delete cascade,
  currency   text not null default 'USD',
  amount     numeric(20, 2) not null check (amount > 0),
  status     text not null default 'pending'
               check (status in ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  provider   text,
  reference  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger withdrawals_updated_at
  before update on public.withdrawals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_logs — immutable security/audit trail (service-role only, never exposed)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  actor_type  text not null default 'user' check (actor_type in ('user', 'system', 'service')),
  action      text not null,
  entity_type text,
  entity_id   uuid,
  details     jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

create index audit_logs_user_idx on public.audit_logs (user_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs (action, created_at desc);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  title             text not null,
  message           text,
  notification_type text not null default 'system',
  is_read           boolean not null default false,
  created_at        timestamptz not null default now(),
  read_at           timestamptz
);

create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- Seed the tradeable universe (matches the frontend mock universe exactly)
-- ---------------------------------------------------------------------------
insert into public.assets (symbol, name, asset_type, exchange) values
  ('BTC/USD', 'Bitcoin',             'crypto', 'CRYPTO'),
  ('ETH/USD', 'Ethereum',            'crypto', 'CRYPTO'),
  ('SOL/USD', 'Solana',              'crypto', 'CRYPTO'),
  ('AAPL',    'Apple Inc.',          'stock',  'NASDAQ'),
  ('MSFT',    'Microsoft Corp.',     'stock',  'NASDAQ'),
  ('NVDA',    'NVIDIA Corp.',        'stock',  'NASDAQ'),
  ('TSLA',    'Tesla Inc.',          'stock',  'NASDAQ'),
  ('AMZN',    'Amazon.com Inc.',     'stock',  'NASDAQ'),
  ('SPY',     'SPDR S&P 500 ETF',    'etf',    'NYSEARCA'),
  ('QQQ',     'Invesco QQQ Trust',   'etf',    'NASDAQ')
on conflict (symbol) do update set
  name       = excluded.name,
  asset_type = excluded.asset_type,
  exchange   = excluded.exchange;