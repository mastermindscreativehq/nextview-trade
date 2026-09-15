import fp from "fastify-plugin";
import type { FastifyRequest } from "fastify";
import type { AppEnv } from "../config/env.js";
import type { TokenVerifier } from "../lib/auth.js";
import { extractBearerToken } from "../lib/auth.js";
import { UnauthorizedError } from "../lib/http-error.js";
import { createAuthClient } from "../lib/supabase.js";

export interface AuthPluginOptions {
  env: AppEnv;
  /** Injectable token verifier (used by tests). Defaults to Supabase Auth. */
  verifyToken?: TokenVerifier;
}

export default fp<AuthPluginOptions>(async (app, opts) => {
  const defaultVerifier: TokenVerifier = async (token) => {
    const supabase = createAuthClient(opts.env.SUPABASE_URL, opts.env.SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return {
      id: data.user.id,
      email: data.user.email ?? undefined,
      role: data.user.role ?? "authenticated",
    };
  };

  const verifyToken = opts.verifyToken ?? defaultVerifier;

  app.decorateRequest("user", null);

  app.decorate("authenticate", async (request: FastifyRequest) => {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedError("Missing bearer token");
    }
    const user = await verifyToken(token);
    if (!user) {
      throw new UnauthorizedError("Invalid or expired token");
    }
    request.user = user;
  });
});

// Re-export for import convenience from route plugins.
export type { AuthenticatedUser } from "../lib/auth.js";