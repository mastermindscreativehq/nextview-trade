import type { SupabaseClient } from "@supabase/supabase-js";
import { BalanceRow, getBalancesByAccountId } from "../repositories/account.repository.js";
import {
  getProfileByUserId,
  getTradingAccountByUserId,
  type ProfileRow,
  type TradingAccountRow,
} from "../repositories/account.repository.js";
import { NotFoundError } from "../lib/http-error.js";

export interface BalanceDto {
  id: string;
  accountId: string;
  currency: string;
  available: string;
  reserved: string;
  updatedAt: string;
}

export interface AccountDto {
  id: string;
  userId: string;
  accountType: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileDto {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSnapshot {
  profile: ProfileDto;
  tradingAccount: AccountDto | null;
  balances: BalanceDto[];
}

function toProfileDto(row: ProfileRow): ProfileDto {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAccountDto(row: TradingAccountRow): AccountDto {
  return {
    id: row.id,
    userId: row.user_id,
    accountType: row.account_type,
    accountStatus: row.account_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBalanceDto(row: BalanceRow): BalanceDto {
  return {
    id: row.id,
    accountId: row.account_id,
    currency: row.currency,
    available: row.available,
    reserved: row.reserved,
    updatedAt: row.updated_at,
  };
}

/**
 * Authoritative account snapshot for an authenticated user.
 * The user id ALWAYS comes from the verified JWT (request.user.id) and is never
 * taken from client input, which makes IDOR impossible at this layer.
 */
export async function getAccountSnapshot(
  db: SupabaseClient,
  userId: string
): Promise<AccountSnapshot> {
  const profile = await getProfileByUserId(db, userId);
  if (!profile) {
    throw new NotFoundError("Account not found");
  }

  const tradingAccount = await getTradingAccountByUserId(db, userId);
  const balances = tradingAccount
    ? await getBalancesByAccountId(db, tradingAccount.id)
    : [];

  return {
    profile: toProfileDto(profile),
    tradingAccount: tradingAccount ? toAccountDto(tradingAccount) : null,
    balances: balances.map(toBalanceDto),
  };
}