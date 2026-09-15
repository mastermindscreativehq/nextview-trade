import type { AuthenticatedUser, TokenVerifier } from "../lib/auth.js";
import type { AppEnv } from "../config/env.js";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser | null;
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: import("fastify").FastifyReply
    ) => Promise<void>;
  }
}

export type { AuthenticatedUser, TokenVerifier, AppEnv };