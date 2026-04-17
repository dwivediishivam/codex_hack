import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  APP_BASE_URL: z.string().url().default("http://localhost:8080"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  CODEX_BIN: z.string().default("codex"),
  CODEX_MODEL: z.string().optional(),
  CODEX_WORKSPACE_ROOT: z.string().optional(),
  CODEX_TIMEOUT_MS: z.coerce.number().default(120000),
  GENERATED_APPS_BUCKET: z.string().default("generated-apps"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
  SUPABASE_DB_PASSWORD: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_ORG: z.string().optional()
});

export const env = schema.parse(process.env);
