-- NEXTVIEW TRADE — 0002_rls_policies.sql
-- Row Level Security. Every user-owned table is protected by ownership policies.
-- The service role bypasses RLS for backend/trigger writes. Direct table writes
-- from anon/authenticated clients are blocked unless a policy exists.

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.trading_accounts  enable row level security;
alter table public.balances          enable row level security;
alter table public.ledger_entries    enable row level security;
alter table public.transactions      enable row level security;
alter table public.orders            enable row level security;
alter table public.trades            enable row level security;
alter table public.positions         enable row level security;
alter table public.watchlists        enable row level security;
alter table public.watchlist_items   enable row level security;
alter table public.deposits          enable row level security;
alter table public.withdrawals       enable row level security;
alter table public.audit_logs        enable row level security;
alter table public.notifications     enable row level security;
alter table public.assets            enable row level security;
alter table public.market_prices     enable row level security;
alter table public.market_candles    enable row level security;

-- ---------------------------------------------------------------------------
-- Market data: readable by everyone, writable by nobody via RLS.
-- ---------------------------------------------------------------------------
create policy "market data read: anon + authenticated"
  on public.assets for select
  using (true);

create policy "market data read: anon + authenticated"
  on public.market_prices for select
  using (true);

create policy "market data read: anon + authenticated"
  on public.market_candles for select
  using (true);

-- ---------------------------------------------------------------------------
-- profiles — users manage their own profile
-- ---------------------------------------------------------------------------
create policy "profiles select: own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles update: own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- trading_accounts — read-only to the owner, writes are service-role only
-- ---------------------------------------------------------------------------
create policy "trading_accounts select: own"
  on public.trading_accounts for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- balances — read-only to the account owner
-- ---------------------------------------------------------------------------
create policy "balances select: own"
  on public.balances for select
  using (exists (
    select 1 from public.trading_accounts ta
    where ta.id = balances.account_id and ta.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- ledger_entries — read-only to the account owner (never writable by clients)
-- ---------------------------------------------------------------------------
create policy "ledger_entries select: own"
  on public.ledger_entries for select
  using (exists (
    select 1 from public.trading_accounts ta
    where ta.id = ledger_entries.account_id and ta.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- transactions — read-only to the account owner
-- ---------------------------------------------------------------------------
create policy "transactions select: own"
  on public.transactions for select
  using (exists (
    select 1 from public.trading_accounts ta
    where ta.id = transactions.account_id and ta.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- orders / trades / positions — read-only to the owner (Phase 2 writes)
-- ---------------------------------------------------------------------------
create policy "orders select: own"
  on public.orders for select
  using (exists (
    select 1 from public.trading_accounts ta
    where ta.id = orders.account_id and ta.user_id = auth.uid()
  ));

create policy "trades select: own"
  on public.trades for select
  using (exists (
    select 1 from public.trading_accounts ta
    where ta.id = trades.account_id and ta.user_id = auth.uid()
  ));

create policy "positions select: own"
  on public.positions for select
  using (exists (
    select 1 from public.trading_accounts ta
    where ta.id = positions.account_id and ta.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- deposits / withdrawals — read-only to the owner (Phase 3 writes)
-- ---------------------------------------------------------------------------
create policy "deposits select: own"
  on public.deposits for select
  using (exists (
    select 1 from public.trading_accounts ta
    where ta.id = deposits.account_id and ta.user_id = auth.uid()
  ));

create policy "withdrawals select: own"
  on public.withdrawals for select
  using (exists (
    select 1 from public.trading_accounts ta
    where ta.id = withdrawals.account_id and ta.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- watchlists / watchlist_items — full CRUD for the owner
-- ---------------------------------------------------------------------------
create policy "watchlists select: own"
  on public.watchlists for select
  using (auth.uid() = user_id);

create policy "watchlists insert: own"
  on public.watchlists for insert
  with check (auth.uid() = user_id);

create policy "watchlists update: own"
  on public.watchlists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "watchlists delete: own"
  on public.watchlists for delete
  using (auth.uid() = user_id);

create policy "watchlist_items select: own"
  on public.watchlist_items for select
  using (exists (
    select 1 from public.watchlists wl
    where wl.id = watchlist_items.watchlist_id and wl.user_id = auth.uid()
  ));

create policy "watchlist_items insert: own"
  on public.watchlist_items for insert
  with check (exists (
    select 1 from public.watchlists wl
    where wl.id = watchlist_items.watchlist_id and wl.user_id = auth.uid()
  ));

create policy "watchlist_items update: own"
  on public.watchlist_items for update
  using (exists (
    select 1 from public.watchlists wl
    where wl.id = watchlist_items.watchlist_id and wl.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.watchlists wl
    where wl.id = watchlist_items.watchlist_id and wl.user_id = auth.uid()
  ));

create policy "watchlist_items delete: own"
  on public.watchlist_items for delete
  using (exists (
    select 1 from public.watchlists wl
    where wl.id = watchlist_items.watchlist_id and wl.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- notifications — owners can read and mark their own notifications read
-- ---------------------------------------------------------------------------
create policy "notifications select: own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications update: own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- audit_logs — deliberately NO client policies. Only the service role (via
-- SECURITY DEFINER triggers or the backend) can read/write the audit trail.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Explicit grants (RLS still governs; these define the maximum capability)
-- ---------------------------------------------------------------------------
-- Market data: readable by anon + authenticated
grant select on public.assets, public.market_prices, public.market_candles to anon, authenticated;

-- User-owned tables: authenticated only. The policy layer filters rows.
grant select, insert, update, delete on
  public.profiles,
  public.trading_accounts,
  public.balances,
  public.ledger_entries,
  public.transactions,
  public.orders,
  public.trades,
  public.positions,
  public.watchlists,
  public.watchlist_items,
  public.deposits,
  public.withdrawals,
  public.audit_logs,
  public.notifications
  to authenticated;

-- The role used by unauthenticated requests may not touch any user data.
-- (RLS denies on these tables for `anon` regardless, thanks to no policies.)