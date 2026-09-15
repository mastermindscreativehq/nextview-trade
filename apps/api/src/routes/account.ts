import type { FastifyPluginAsync } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getAccountSnapshot } from "../services/account.service.js";
import { parseWithSchema } from "../lib/validation.js";

export interface AccountRoutesOptions {
  db: SupabaseClient;
}

const balanceQuerySchema = z.object({
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code")
    .optional(),
});

export const accountRoutes: FastifyPluginAsync<AccountRoutesOptions> = async (
  app,
  { db }
) => {
  app.get(
    "/api/account",
    { preHandler: app.authenticate },
    async (request) => {
      const user = request.user!;
      const snapshot = await getAccountSnapshot(db, user.id);
      return { data: snapshot };
    }
  );

  app.get(
    "/api/account/balances",
    { preHandler: app.authenticate },
    async (request) => {
      const user = request.user!;
      const query = parseWithSchema(balanceQuerySchema, request.query);
      const snapshot = await getAccountSnapshot(db, user.id);
      const balances = query.currency
        ? snapshot.balances.filter((balance) => balance.currency === query.currency)
        : snapshot.balances;
      return { data: balances };
    }
  );
};