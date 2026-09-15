import type { SupabaseClient } from "@supabase/supabase-js";
import { parseEnv, type AppEnv } from "../config/env.js";

export const testEnv: AppEnv = parseEnv({
  NODE_ENV: "test",
  PORT: "3001",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-123456",
  SUPABASE_ANON_KEY: "test-anon-key-123456",
  FRONTEND_ORIGIN: "http://localhost:3000,http://localhost:3001",
  MARKET_DATA_PROVIDER: "mock",
});

export interface QueryCall {
  table: string;
  column?: string;
  value?: unknown;
}

export interface InsertCall {
  table: string;
  rows: unknown[];
}

type Row = Record<string, unknown>;

interface Fixtures {
  profiles?: Row[];
  trading_accounts?: Row[];
  balances?: Row[];
}

function buildChain(table: string, rows: Row[], captured: QueryCall[]) {
  return {
    eq(column: string, value: unknown) {
      captured.push({ table, column, value });
      const filtered = rows.filter((row) => row[column] === value);
      return {
        maybeSingle: async () => ({ data: filtered[0] ?? null, error: null }),
        order: async () => ({ data: filtered, error: null }),
      };
    },
    order: async () => ({ data: rows, error: null }),
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
  };
}

export interface FakeDbResult {
  client: SupabaseClient;
  queries: QueryCall[];
  inserts: InsertCall[];
}

export function createFakeDb(fixtures: Fixtures = {}): FakeDbResult {
  const queries: QueryCall[] = [];
  const inserts: InsertCall[] = [];

  const db = {
    from(table: string) {
      const rows = (fixtures as Record<string, Row[]>)[table] ?? [];
      return {
        select() {
          return buildChain(table, rows, queries);
        },
        insert(input: Row | Row[]) {
          const list = Array.isArray(input) ? input : [input];
          inserts.push({ table, rows: list });
          return {
            select: async () => ({ data: list[0] ?? null, error: null }),
          };
        },
      };
    },
  };

  return { client: db as unknown as SupabaseClient, queries, inserts };
}

export const validTokenMap = new Map<string, { id: string; email?: string }>([
  ["token-user-a", { id: "user-a", email: "a@example.com" }],
  ["token-user-b", { id: "user-b", email: "b@example.com" }],
]);

export const verifyTokenFixture = async (token: string) =>
  validTokenMap.get(token) ?? null;

export const ACCOUNT_FIXTURES: Fixtures = {
  profiles: [
    {
      id: "user-a",
      email: "a@example.com",
      display_name: "User A",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "user-b",
      email: "b@example.com",
      display_name: "User B",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  trading_accounts: [
    {
      id: "acct-a",
      user_id: "user-a",
      account_type: "paper",
      account_status: "ACTIVE",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "acct-b",
      user_id: "user-b",
      account_type: "paper",
      account_status: "ACTIVE",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  balances: [
    {
      id: "bal-a",
      account_id: "acct-a",
      currency: "USD",
      available: "100000.00",
      reserved: "0.00",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "bal-b",
      account_id: "acct-b",
      currency: "USD",
      available: "100000.00",
      reserved: "0.00",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ],
};