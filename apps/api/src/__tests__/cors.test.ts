import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { testEnv } from "./helpers.js";

describe("CORS enforcement", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ env: testEnv });
  });

  afterAll(async () => {
    await app.close();
  });

  it("allows a request with a matching origin and returns ACAO header", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://localhost:3000" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("blocks a disallowed origin even on a public route with 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://evil.example.com" },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("allows a non-browser client (no Origin header) on any route", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: {},
    });
    expect(res.statusCode).toBe(200);
  });
});