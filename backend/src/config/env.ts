import { z } from "zod";

try {
  process.loadEnvFile?.();
} catch {
  // .env file is optional in testing/CI environments
}

// ---------------------------------------------------------------------------
// Environment schema — all application configuration in one validated place.
// Required variables fail startup immediately. Secrets are never logged.
// ---------------------------------------------------------------------------

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default(
      process.env["NODE_ENV"] === "test"
        ? "postgresql://localhost:5432/bidsure_test"
        : ""
    ),
  PORT: z
    .string()
    .default("3000")
    .transform((v) => {
      const n = Number(v);
      if (isNaN(n) || n < 1 || n > 65535) throw new Error(`PORT must be a valid port number, got: ${v}`);
      return n;
    }),
  API_PREFIX: z.string().default("/api/v1"),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("60000")
    .transform((v) => Number(v)),
  RATE_LIMIT_MAX: z
    .string()
    .default("100")
    .transform((v) => Number(v)),
});

type EnvInput = z.input<typeof envSchema>;

const rawEnv: EnvInput = {
  NODE_ENV: process.env["NODE_ENV"] as EnvInput["NODE_ENV"],
  DATABASE_URL: process.env["DATABASE_URL"],
  PORT: process.env["PORT"],
  API_PREFIX: process.env["API_PREFIX"],
  FRONTEND_ORIGIN: process.env["FRONTEND_ORIGIN"],
  LOG_LEVEL: process.env["LOG_LEVEL"] as EnvInput["LOG_LEVEL"],
  RATE_LIMIT_WINDOW_MS: process.env["RATE_LIMIT_WINDOW_MS"],
  RATE_LIMIT_MAX: process.env["RATE_LIMIT_MAX"],
};

const result = envSchema.safeParse(rawEnv);

if (!result.success) {
  // Log to stderr and exit — secrets are not echoed, only field names
  const issues = result.error.issues.map((i) => `  [${i.path.join(".")}] ${i.message}`).join("\n");
  process.stderr.write(`\n[BidSure] FATAL: Invalid environment configuration:\n${issues}\n\n`);
  process.exit(1);
}

const env = result.data;

export interface Config {
  nodeEnv: "development" | "production" | "test";
  databaseUrl: string;
  port: number;
  apiPrefix: string;
  frontendOrigin: string;
  logLevel: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  serviceName: string;
  version: string;
  /** Convenience accessors */
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
}

export const config: Config = {
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  frontendOrigin: env.FRONTEND_ORIGIN,
  logLevel: env.LOG_LEVEL,
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: env.RATE_LIMIT_MAX,
  serviceName: "bidsure-api",
  version: "1.0.0",
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
};
