import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS, used ONLY server-side for authoritative
// reads/writes. Never imported by any frontend code.
export function createAdminClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Anon-key client used to verify user JWTs against Supabase Auth.
export function createAuthClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}