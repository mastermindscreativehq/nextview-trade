-- NEXTVIEW TRADE — 0003_provisioning.sql
-- Database-authoritative account provisioning and auth audit triggers.
--
-- Whenever a row lands in auth.users (registration, admin user creation,
-- OAuth, email-confirmation auto-creation), handle_new_user() runs inside the
-- SAME transaction and atomically creates: profile, paper trading account,
-- initial $100,000.00 virtual balance, ledger entry, transaction record,
-- default watchlist, welcome notification, and a registration audit log.
--
-- Because this is a SECURITY DEFINER trigger, no client code, API route, or
-- service-role key can inject amounts or create a half-provisioned account.
-- If any statement fails, the whole transaction rolls back.
--
-- Duplicate provisioning is impossible: auth.users rows are created once, the
-- trigger fires once per insert, and the unique paper-account index is a
-- second line of defense. Re-running the function for an existing user raises.

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
    -- Already provisioned (defensive; unique indexes back this up anyway).
    return new;
  end if;

  v_display_name := nullif(new.raw_user_meta_data ->> 'display_name', '');
  if v_display_name is null then
    v_display_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, v_display_name);

  insert into public.trading_accounts (user_id, account_type, status)
  values (new.id, 'paper', 'active')
  returning id into v_account_id;

  insert into public.balances (account_id, currency, available, reserved)
  values (v_account_id, 'USD', v_initial_usd, 0.00);

  insert into public.ledger_entries (
    account_id, entry_type, amount, balance_after, reference_id, reference_type, description
  ) values (
    v_account_id, 'initial_funding', v_initial_usd, v_initial_usd, new.id, 'provisioning',
    'Initial paper trading funds'
  );

  insert into public.transactions (
    account_id, transaction_type, amount, status, description, reference_id
  ) values (
    v_account_id, 'initial_funding', v_initial_usd, 'completed',
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
    -- Duplicate provisioning attempt: fail loudly so partial state can never exist.
    raise exception 'duplicate paper account provisioning for user %', new.id;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Auth audit trail: log login + password-reset requests as auth.users changes.
-- ---------------------------------------------------------------------------
create or replace function public.log_auth_user_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at and new.last_sign_in_at is not null then
    insert into public.audit_logs (user_id, actor_type, action, entity_type, entity_id)
    values (new.id, 'user', 'auth.login', 'auth_user', new.id);
  end if;

  if new.recovery_sent_at is distinct from old.recovery_sent_at and new.recovery_sent_at is not null then
    insert into public.audit_logs (user_id, actor_type, action, entity_type, entity_id)
    values (new.id, 'user', 'auth.password_reset_requested', 'auth_user', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  before update on auth.users
  for each row execute function public.log_auth_user_event();

-- ---------------------------------------------------------------------------
-- Keep profile email in sync when auth.users.email changes.
-- ---------------------------------------------------------------------------
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  before update on auth.users
  for each row when (new.email is distinct from old.email)
  execute function public.sync_profile_email();