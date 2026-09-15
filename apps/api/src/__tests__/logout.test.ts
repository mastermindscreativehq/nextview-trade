import { describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { ACCOUNT_FIXTURES, createFakeDb, testEnv, verifyTokenFixture } from "./helpers.js";

// Re-created fixtures live in auth.fixtures.ts via import in auth.test; this
// suite only needs the shared helper above.
describe("logout audit trail", () => {
  it("records an auth.logout audit entry for the authenticated user", async () => {
    const { client, inserts } = createFakeDb(ACCOUNT_FIXTURES);
    const app: FastifyInstance = await buildApp({
      env: testEnv,
      adminClient: client,
      verifyToken: verifyTokenFixture,
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { authorization: "Bearer token-user-a" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ data: { ok: true } });

    const audit = inserts.find((entry) => entry.table === "audit_logs");
    expect(audit).toBeDefined();
    expect(audit!.rows[0]).toMatchObject({
      user_id: "user-a",
      actor_type: "user",
      action: "auth.logout",
      entity_type: "auth_user",
      entity_id: "user-a",
    });

    await app.close();
  });

  it("does not write an audit entry when unauthenticated", async () => {
    const { client, inserts } = createFakeDb(ACCOUNT_FIXTURES);
    const app: FastifyInstance = await buildApp({
      env: testEnv,
      adminClient: client,
      verifyToken: verifyTokenFixture,
    });

    const res = await app.inject({ method: "POST", url: "/api/auth/logout" });
    expect(res.statusCode).toBe(401);
    expect(inserts).toHaveLength(0);
    await app.close();
  });
});