import type { SupabaseClient } from "@supabase/supabase-js";

function queryFailed(what: string, cause: unknown): never {
  throw new Error(`${what}: ${cause instanceof Error ? cause.message : String(cause)}`, {
    cause,
  });
}

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradingAccountRow {
  id: string;
  user_id: string;
  account_type: string;
  account_status: string;
  created_at: string;
  updated_at: string;
}

export interface BalanceRow {
  id: string;
  account_id: string;
  currency: string;
  available: string;
  reserved: string;
  updated_at: string;
}

export interface AuditLogInsert {
  user_id: string;
  actor_type: "user" | "system" | "service";
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export async function getProfileByUserId(
  db: SupabaseClient,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await db
    .from("profiles")
    .select("id, email, display_name, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    queryFailed("Failed to load profile", error);
  }
  return (data as ProfileRow | null) ?? null;
}

export async function getTradingAccountByUserId(
  db: SupabaseClient,
  userId: string
): Promise<TradingAccountRow | null> {
  const { data, error } = await db
    .from("trading_accounts")
    .select("id, user_id, account_type, account_status, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    queryFailed("Failed to load trading account", error);
  }
  return (data as TradingAccountRow | null) ?? null;
}

export async function getBalancesByAccountId(
  db: SupabaseClient,
  accountId: string
): Promise<BalanceRow[]> {
  const { data, error } = await db
    .from("balances")
    .select("id, account_id, currency, available, reserved, updated_at")
    .eq("account_id", accountId)
    .order("currency", { ascending: true });

  if (error) {
    queryFailed("Failed to load balances", error);
  }
  return (data as BalanceRow[]) ?? [];
}

export async function insertAuditLog(
  db: SupabaseClient,
  entry: AuditLogInsert
): Promise<void> {
  const { error } = await db.from("audit_logs").insert({
    user_id: entry.user_id,
    actor_type: entry.actor_type,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    details: entry.details,
  });

  if (error) {
    queryFailed("Failed to write audit log", error);
  }
}