import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "../lib/supabase.js";

/**
 * Live integration test for the database-authoritative provisioning trigger.
 *
 * Requires real Supabase credentials on the environment:
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY
 * and the migrations (schema + RLS + provisioning) applied to that project.
 *
 * Skipped automatically when the credentials are absent, so `pnpm test` stays
 * green in CI without external infrastructure.
 */
const live = Boolean(
  process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_ANON_KEY
);

describe.skipIf(!live)("provisioning (live Supabase)", () => {
  it("atomically provisions profile, paper account, $100,000 balance, ledger, watchlist, notification and audit entry", async () => {
    const admin = createAdminClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const email = `provisioning-test-${randomUUID()}@example.com`;
    const created = await admin.auth.admin.createUser({
      email,
      password: "Test-Provision-123!",
      email_confirm: true,
    });
    expect(created.error).toBeNull();
    const userId = created.data.user.id;

    try {
      const { data: profile } = await admin.from("profiles").select("*").eq("id", userId).single();
      expect(profile).not.toBeNull();

      const { data: account } = await admin
        .from("trading_accounts")
        .select("*")
        .eq("user_id", userId)
        .single();
      expect(account).not.toBeNull();
      expect(account.account_type).toBe("paper");
      expect(account.account_status).toBe("ACTIVE");

      const { data: balances } = await admin
        .from("balances")
        .select("*")
        .eq("account_id", account.id);
      expect(balances).toHaveLength(1);
      expect(balances[0].currency).toBe("USD");
      expect(balances[0].available).toBe("100000.00");
      expect(balances[0].reserved).toBe("0.00");

      const { data: ledger } = await admin
        .from("ledger_entries")
        .select("*")
        .eq("account_id", account.id);
      expect(ledger).toHaveLength(1);
      expect(ledger[0].entry_type).toBe("INITIAL_FUNDING");
      expect(ledger[0].amount).toBe("100000.00");
      expect(ledger[0].balance_after).toBe("100000.00");

      const { data: transactions } = await admin
        .from("transactions")
        .select("*")
        .eq("account_id", account.id);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].transaction_type).toBe("DEPOSIT");
      expect(transactions[0].status).toBe("COMPLETED");
      expect(transactions[0].amount).toBe("100000.00");

      const { data: watchlists } = await admin
        .from("watchlists")
        .select("*")
        .eq("user_id", userId);
      expect(watchlists).toHaveLength(1);

      const { data: notifications } = await admin
        .from("notifications")
        .select("*")
        .eq("user_id", userId);
      expect(notifications.length).toBeGreaterThan(0);

      const { data: audit } = await admin
        .from("audit_logs")
        .select("action")
        .eq("user_id", userId)
        .eq("action", "auth.registration");
      expect(audit).toHaveLength(1);
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  it("prevents a second paper account for the same user (duplicate provisioning guard)", async () => {
    const admin = createAdminClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const email = `provisioning-dup-${randomUUID()}@example.com`;
    const created = await admin.auth.admin.createUser({
      email,
      password: "Test-Provision-123!",
      email_confirm: true,
    });
    const userId = created.data.user.id;

    try {
      const { data: account } = await admin
        .from("trading_accounts")
        .select("id")
        .eq("user_id", userId)
        .single();

      const dup = await admin.from("trading_accounts").insert({
        user_id: userId,
        account_name: "Paper Account",
        account_type: "paper",
        account_status: "ACTIVE",
        base_currency: "USD",
        initial_virtual_balance: "100000.00",
      });
      expect(dup.error).not.toBeNull();
      expect(dup.error!.code).toBe("23505"); // unique_violation

      const { data: stillOne } = await admin
        .from("trading_accounts")
        .select("id")
        .eq("user_id", userId);
      expect(stillOne).toHaveLength(1);
      expect(stillOne[0].id).toBe(account.id);
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  it("blocks anon reads and cross-user reads of user-owned financial tables", async () => {
    const admin = createAdminClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const createUser = async (prefix: string) => {
      const email = `provisioning-rls-${prefix}-${randomUUID()}@example.com`;
      const created = await admin.auth.admin.createUser({
        email,
        password: "Test-Provision-123!",
        email_confirm: true,
      });
      expect(created.error).toBeNull();
      const { data: account } = await admin
        .from("trading_accounts")
        .select("id")
        .eq("user_id", created.data.user.id)
        .single();
      return { email, userId: created.data.user.id, accountId: account.id };
    };

    const userA = await createUser("a");
    const userB = await createUser("b");

    try {
      // An authenticated client (anon key + user B JWT): must NOT see user A's
      // financial rows — ownership isolation holds with or without owner-read
      // policies in the authoritative RLS inventory.
      const auth = createAdminClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
      const { data: login } = await auth.auth.signInWithPassword({
        email: userB.email,
        password: "Test-Provision-123!",
      });
      expect(login.session).toBeTruthy();

      const client = createAdminClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
      await client.auth.setSession({
        access_token: login.session!.access_token,
        refresh_token: login.session!.refresh_token,
      });

      const { data: otherBalances } = await client
        .from("balances")
        .select("*")
        .eq("account_id", userA.accountId);
      expect(otherBalances).toEqual([]);

      const { data: otherLedger } = await client
        .from("ledger_entries")
        .select("*")
        .eq("account_id", userA.accountId);
      expect(otherLedger).toEqual([]);

      // Unauthenticated (anonymous) client: RLS denies every user-owned read.
      const anon = createAdminClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
      const { data: anonBalances } = await anon
        .from("balances")
        .select("*")
        .eq("account_id", userA.accountId);
      expect(anonBalances).toEqual([]);
      const { data: anonAudit } = await anon.from("audit_logs").select("*");
      expect(anonAudit).toEqual([]);
    } finally {
      await admin.auth.admin.deleteUser(userA.userId);
      await admin.auth.admin.deleteUser(userB.userId);
    }
  });
});