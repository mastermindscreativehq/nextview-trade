import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseEnv, type AppEnv } from "./config/env.js";
import { createAdminClient } from "./lib/supabase.js";
import type { TokenVerifier } from "./lib/auth.js";
import { ApiError, ForbiddenError, NotFoundError } from "./lib/http-error.js";
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { accountRoutes } from "./routes/account.js";
import { authRoutes } from "./routes/auth.js";

export interface BuildAppOptions {
  env?: AppEnv;
  adminClient?: SupabaseClient;
  verifyToken?: TokenVerifier;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = opts.env ?? parseEnv();
  const admin = opts.adminClient ?? createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const server = Fastify({
    logger:
      env.NODE_ENV === "test"
        ? false
        : {
            level: env.NODE_ENV === "production" ? "info" : "debug",
            transport: {
              target: "pino/file",
              options: { destination: 1 },
            },
          },
  });

  const allowedOrigins = env.FRONTEND_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  await server.register(cors, {
    origin: (origin, callback) => {
      // Non-browser clients (curl, server-to-server) send no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });

  await server.register(helmet);
  await server.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  // Error contract: every failure leaves the API as { error: { code, message, details? } }.
  server.setNotFoundHandler(async (_request, reply) => {
    reply.status(404).send(new NotFoundError("Route not found").toBody());
  });

  server.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ApiError) {
      reply.status(error.statusCode).send(error.toBody());
      return;
    }
    // @fastify/cors rejects disallowed origins by throwing mid-route.
    if (error.message === "Not allowed by CORS") {
      reply.status(403).send(new ForbiddenError("Origin not allowed").toBody());
      return;
    }
    request.log.error({ err: error }, "unhandled error");
    reply
      .status(500)
      .send({ error: { code: "INTERNAL", message: "Internal server error" } });
  });

  await server.register(authPlugin, { env, verifyToken: opts.verifyToken });

  await server.register(healthRoutes);
  await server.register(accountRoutes, { db: admin });
  await server.register(authRoutes, { db: admin });

  return server;
}

export { parseEnv };
export type { AppEnv };