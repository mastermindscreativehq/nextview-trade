import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { ACCOUNT_FIXTURES, createFakeDb, testEnv, verifyTokenFixture } from "./helpers.js";

describe("auth boundaries (fastify API)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const { client } = createFakeDb(ACCOUNT_FIXTURES);
    app = await buildApp({
      env: testEnv,
      adminClient: client,
      verifyToken: verifyTokenFixture,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const protectedRoutes: Array<{ method: "GET" | "POST"; url: string }> = [
    { method: "GET", url: "/api/account" },
    { method: "GET", url: "/api/account/balances" },
    { method: "POST", url: "/api/auth/logout" },
  ];

  for (const route of protectedRoutes) {
    it(`${route.method} ${route.url} is rejected with 401 when no token is sent`, async () => {
      const res = await app.inject({ method: route.method, url: route.url });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe("UNAUTHORIZED");
    });

    it(`${route.method} ${route.url} is rejected with 401 on a malformed Authorization header`, async () => {
      const res = await app.inject({
        method: route.method,
        url: route.url,
        headers: { authorization: "Basic dXNlcjpwYXNz" },
      });
      expect(res.statusCode).toBe(401);
    });
  }

  it("rejects an invalid/expired token with 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/account",
      headers: { authorization: "Bearer token-that-is-not-valid" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });

  it("returns the authenticated user's own account snapshot for a valid token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/account",
      headers: { authorization: "Bearer token-user-a" },
    });
    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.profile.id).toBe("user-a");
    expect(data.tradingAccount.userId).toBe("user-a");
    expect(data.balances).toHaveLength(1);
    expect(data.balances[0].available).toBe("100000.00");
  });

  it("scopes every account lookup to the verified user id (ownership)", async () => {
    const { client, queries } = createFakeDb(ACCOUNT_FIXTURES);
    const scoped = await buildApp({
      env: testEnv,
      adminClient: client,
      verifyToken: verifyTokenFixture,
    });
    await scoped.inject({
      method: "GET",
      url: "/api/account",
      headers: { authorization: "Bearer token-user-a" },
    });
    const tradingAccountQuery = queries.find((q) => q.table === "trading_accounts");
    expect(tradingAccountQuery?.column).toBe("user_id");
    expect(tradingAccountQuery?.value).toBe("user-a");
    // The user id must come from the verified JWT, never from client input.
    const profileQuery = queries.find((q) => q.table === "profiles");
    expect(profileQuery?.value).toBe("user-a");
    await scoped.close();
  });

  it("never exposes another user's account (IDOR), even when those rows exist", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/account",
      headers: { authorization: "Bearer token-user-b" },
    });
    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.profile.id).toBe("user-b");
    expect(data.tradingAccount.userId).toBe("user-b");
    expect(data.balances.map((b: { accountId: string }) => b.accountId)).toEqual(["acct-b"]);
  });

  it("accepts a client-supplied account-ish query param without using it (no trust in input)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/account/balances/fake-account-id",
      headers: { authorization: "Bearer token-user-a" },
    });
    // Unknown sub-route must 404 instead of attempting to use the param.
    expect(res.statusCode).toBe(404);
  });

  it("filters /api/account/balances by a requested currency", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/account/balances?currency=USD",
      headers: { authorization: "Bearer token-user-a" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data[0].currency).toBe("USD");
  });

  it("rejects an invalid currency query with 400 VALIDATION_ERROR", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/account/balances?currency=us$",
      headers: { authorization: "Bearer token-user-a" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 NOT_FOUND when the verified user is not provisioned yet", async () => {
    const { client } = createFakeDb({ profiles: [], trading_accounts: [], balances: [] });
    const ghost = await buildApp({
      env: testEnv,
      adminClient: client,
      verifyToken: async () => ({ id: "user-ghost", email: "ghost@example.com" }),
    });
    const res = await ghost.inject({
      method: "GET",
      url: "/api/account",
      headers: { authorization: "Bearer token-whatever" },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
    await ghost.close();
  });
});