import type { FastifyPluginAsync } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insertAuditLog } from "../repositories/account.repository.js";

export interface AuthRoutesOptions {
  db: SupabaseClient;
}

export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (
  app,
  { db }
) => {
  // Called by the frontend right before local sign-out so the audit trail is
  // complete even though Supabase itself does not emit a logout event.
  app.post(
    "/api/auth/logout",
    { preHandler: app.authenticate },
    async (request) => {
      const user = request.user!;
      await insertAuditLog(db, {
        user_id: user.id,
        actor_type: "user",
        action: "auth.logout",
        entity_type: "auth_user",
        entity_id: user.id,
      });
      return { data: { ok: true } };
    }
  );
};