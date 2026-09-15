-- NEXTVIEW TRADE — 0004_reconcile_existing.sql
--
-- Reconciliation migration for the EXISTING production database.
-- Additive / idempotent ONLY:
--   * NO DROP TABLE, NO TRUNCATE, no table recreation
--   * NO destructive enum replacement / deletion
--   * NO broad RLS policy reset
--   * preserves all existing objects and data
--
-- What 0001..0003 built assumed a fresh database. The production database
-- already contains the 17 tables (RLS enabled), the enums below, the auth
-- users triggers and the four functions. This migration only:
--
--   1. REPAIRS the schema-stale provisioning function public.handle_new_user()
--      so it matches the authoritative production column names/enums.
--   2. Hardens EXECUTE privileges on the three SECURITY DEFINER functions.
--   3. Guarantees the one-paper-account-per-user unique guard index exists.
--   4. Re-asserts RLS is enabled on every public table (idempotent).
--   5. Verifies the provisioning architecture is intact (assertion block).
--
-- Authoritative production facts this migration depends on:
--   * trading_accounts.account_status  : enum  account_status  (ACTIVE/SUSPENDED/CLOSED)
--   * ledger_entries.entry_type        : enum  ledger_type     (INITIAL_FUNDING, …)
--   * transactions.transaction_type    : enum  transaction_type (TRADE/FEE/DEPOSIT/WITHDRAWAL/ADJUSTMENT — NO INITIAL_FUNDING)
--   * transactions.status              : enum  transaction_status (PENDING/COMPLETED/FAILED/CANCELLED)
--
-- Provisioning-funding decision (least invasive, no new enum values):
--   * The authoritative money trail (ledger_entries) records the funding as
--     ledger_type.INITIAL_FUNDING.
--   * The user-facing transactions feed has no INITIAL_FUNDING member; we do
--     NOT invent one. Instead the feed row uses transaction_type.DEPOSIT with
--     a descriptive message and reference to the provisioning event.
--   * balances carries the $100,000.00 available (authoritative cash state).

-- =====================================================================
-- 1. REPAIR handle_new_user() — schema-stale column/enum references
-- =====================================================================
-- The previous production body referenced trading_accounts.status (column does
-- not exist; it is account_status) and inserted lowercase / nonexistent enum
-- values (transaction_type 'initial_funding' has no enum member). Those
-- statements would have failed on the very first signup. This CREATE OR
-- REPLACE preserves the exact provisioning architecture (auth.users INSERT ->
-- on_auth_user_created -> handle_new_user), the $100,000.00 initial balance,
-- atomicity and duplicate protection.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id    uuid;
  v_display_name  text;
  v_initial_usd   numeric(20, 2) := 100000.00;
  v_profile_count int;
begin
  select count(*) into v_profile_count from public.profiles where id = new.id;
  if v_profile_count > 0 then
    return new;
  end if;

  v_display_name := nullif(new.raw_user_meta_data ->> 'display_name', '');
  if v_display_name is null then
    v_display_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, v_display_name);

  insert into public.trading_accounts (
    user_id, account_name, account_type, account_status, base_currency, initial_virtual_balance
  ) values (
    new.id,
    'Paper Account',
    'paper',
    'ACTIVE',
    'USD',
    v_initial_usd
  )
  returning id into v_account_id;

  insert into public.balances (account_id, currency, available, reserved)
  values (v_account_id, 'USD', v_initial_usd, 0.00);

  insert into public.ledger_entries (
    account_id, entry_type, amount, balance_after, reference_id, reference_type, description
  ) values (
    v_account_id, 'INITIAL_FUNDING', v_initial_usd, v_initial_usd, new.id, 'provisioning',
    'Initial paper trading funds'
  );

  insert into public.transactions (
    account_id, transaction_type, amount, status, description, reference_id
  ) values (
    v_account_id, 'DEPOSIT', v_initial_usd, 'COMPLETED',
    'Paper trading account funded with $100,000.00 virtual USD', new.id
  );

  insert into public.watchlists (user_id, name)
  values (new.id, 'Default');

  insert into public.notifications (user_id, title, message, notification_type)
  values (
    new.id, 'Welcome to NEXTVIEW TRADE',
    'Your paper trading account is ready with $100,000.00 in virtual buying power.',
    'welcome'
  );

  insert into public.audit_logs (user_id, actor_type, action, entity_type, entity_id, details)
  values (
    new.id, 'system', 'auth.registration', 'auth_user', new.id,
    jsonb_build_object('account_id', v_account_id, 'starting_balance', v_initial_usd)
  );

  return new;
exception
  when unique_violation then
    raise exception 'duplicate paper account provisioning for user %', new.id;
end;
$$;

-- =====================================================================
-- 2. HARDEN EXECUTE PRIVILEGES ON SECURITY DEFINER FUNCTIONS
-- =====================================================================
-- The three SECURITY DEFINER functions are only intended to be fired by the
-- auth.users triggers (GoTrue) and the backend. Direct execution by
-- anon/authenticated is never required. Revoke PUBLIC/anon/authenticated and
-- explicitly grant the roles that must be able to fire the triggers.
-- (Trigger firing runs under the role performing the INSERT/UPDATE on
--  auth.users, which is supabase_auth_admin for GoTrue.)

revoke execute on function public.handle_new_user()       from public, anon, authenticated;
revoke execute on function public.sync_profile_email()    from public, anon, authenticated;
revoke execute on function public.log_auth_user_event()   from public, anon, authenticated;

grant execute on function public.handle_new_user()        to postgres, service_role, supabase_auth_admin;
grant execute on function public.sync_profile_email()     to postgres, service_role, supabase_auth_admin;
grant execute on function public.log_auth_user_event()    to postgres, service_role, supabase_auth_admin;

-- set_updated_at() is NOT SECURITY DEFINER and fires on UPDATE of user-owned
-- tables whichever role performs the write (backend service_role today,
-- possibly RLS-governed anon/authenticated later). Keep it executable by every
-- role that could trigger it, while removing the blanket PUBLIC grant.
revoke execute on function public.set_updated_at() from public;

grant execute on function public.set_updated_at() to
  postgres, service_role, supabase_auth_admin, anon, authenticated, authenticator;

-- =====================================================================
-- 3. ONE-PAPER-ACCOUNT-PER-USER GUARD INDEX (idempotent)
-- =====================================================================
-- The provisioning function's unique_violation exception handler depends on a
-- unique index over (user_id) WHERE account_type = 'paper'. Create it if the
-- production database does not already carry it. Table is empty today, so
-- there is no risk of an existing duplicate block.

create unique index if not exists trading_accounts_one_paper_per_user
  on public.trading_accounts (user_id)
  where account_type = 'paper';

-- =====================================================================
-- 4. RE-ASSERT RLS ENABLED ON EVERY PUBLIC TABLE (idempotent)
-- =====================================================================
-- All 17 are already enabled in production; this is a self-healing assertion
-- so the invariant cannot silently regress.

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

-- =====================================================================
-- 5. ASSERT PROVISIONING ARCHITECTURE IS INTACT
-- =====================================================================
-- Fail loudly if anything undermines the auth.users -> handle_new_user()
-- provisioning path after this migration.

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ) then
    raise exception '0004: public.handle_new_user() is missing';
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth' and c.relname = 'users' and t.tgname = 'on_auth_user_created'
  ) then
    raise exception '0004: on_auth_user_created trigger is missing on auth.users';
  end if;
end
$$;

-- =====================================================================
-- RLS POLICY RECONCILIATION NOTE
-- =====================================================================
-- The production database carries 47 RLS policies; that inventory is the
-- authoritative source and is deliberately LEFT UNTOUCHED by this migration.
-- No policies are created here: without the per-policy inventory dictating
-- which of the 47 cover application reads, adding policies risks duplicates
-- and broadens rather than narrows the surface. RLS policy changes are gated
-- on a reviewed diff of the authoritative 47-policy snapshot.