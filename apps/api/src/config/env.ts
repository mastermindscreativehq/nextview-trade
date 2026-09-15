import { existsSync } from "node:fs";
import { config } from "dotenv";
import { z } from "zod";

// Load .env then .env.local (local wins). Never overrides real platform vars
// because dotenv only reads files; values already set in process.env win.
for (const path of [".env", ".env.local"]) {
  if (existsSync(path)) {
    const result = config({ path });
    if (result.error) {
      throw result.error;
    }
    Object.assign(process.env, result.parsed);
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(10, "SUPABASE_SERVICE_ROLE_KEY is required (server-only, never expose)"),
  SUPABASE_ANON_KEY: z.string().min(10, "SUPABASE_ANON_KEY is required"),
  FRONTEND_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .refine(
      (value) => value.split(",").every((origin) => origin.trim().startsWith("http")),
      "FRONTEND_ORIGIN must be a comma-separated list of http(s) origins"
    ),
  MARKET_DATA_PROVIDER: z.enum(["mock"]).default("mock"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  return parsed.data;
}