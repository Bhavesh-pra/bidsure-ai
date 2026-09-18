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
  DOCUMENT_MAX_SIZE_MB: z
    .string()
    .default("10")
    .transform((v) => {
      const n = Number(v);
      if (isNaN(n) || n <= 0) throw new Error("DOCUMENT_MAX_SIZE_MB must be a positive number");
      return n;
    }),
  DOCUMENT_STORAGE_DIR: z.string().default("./storage/documents"),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().default("bidsure-documents"),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  REDIS_URL: z.string().optional(),
  QUEUE_MODE: z.enum(["bullmq", "memory"]).default("memory"),
  SCANNER_MODE: z.enum(["real", "development"]).default("development"),
  CLAMAV_HOST: z.string().optional(),
  CLAMAV_PORT: z
    .string()
    .default("3310")
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
  DOCUMENT_MAX_SIZE_MB: process.env["DOCUMENT_MAX_SIZE_MB"],
  DOCUMENT_STORAGE_DIR: process.env["DOCUMENT_STORAGE_DIR"],
  S3_ENDPOINT: process.env["S3_ENDPOINT"],
  S3_BUCKET: process.env["S3_BUCKET"],
  S3_ACCESS_KEY: process.env["S3_ACCESS_KEY"],
  S3_SECRET_KEY: process.env["S3_SECRET_KEY"],
  S3_REGION: process.env["S3_REGION"],
  REDIS_URL: process.env["REDIS_URL"],
  QUEUE_MODE: (process.env["QUEUE_MODE"] || (process.env["REDIS_URL"] ? "bullmq" : "memory")) as EnvInput["QUEUE_MODE"],
  SCANNER_MODE: (process.env["SCANNER_MODE"] || (process.env["CLAMAV_HOST"] ? "real" : "development")) as EnvInput["SCANNER_MODE"],
  CLAMAV_HOST: process.env["CLAMAV_HOST"],
  CLAMAV_PORT: process.env["CLAMAV_PORT"],
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
  /** Phase 08 Secure Document Ingestion Config */
  documentMaxSizeMb: number;
  documentMaxSizeBytes: number;
  documentStorageDir: string;
  s3Endpoint?: string | undefined;
  s3Bucket: string;
  s3AccessKey?: string | undefined;
  s3SecretKey?: string | undefined;
  s3Region: string;
  redisUrl?: string | undefined;
  queueMode: "bullmq" | "memory";
  scannerMode: "real" | "development";
  clamavHost?: string | undefined;
  clamavPort: number;
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
  documentMaxSizeMb: env.DOCUMENT_MAX_SIZE_MB,
  documentMaxSizeBytes: env.DOCUMENT_MAX_SIZE_MB * 1024 * 1024,
  documentStorageDir: env.DOCUMENT_STORAGE_DIR,
  s3Endpoint: env.S3_ENDPOINT,
  s3Bucket: env.S3_BUCKET,
  s3AccessKey: env.S3_ACCESS_KEY,
  s3SecretKey: env.S3_SECRET_KEY,
  s3Region: env.S3_REGION,
  redisUrl: env.REDIS_URL,
  queueMode: env.QUEUE_MODE,
  scannerMode: env.SCANNER_MODE,
  clamavHost: env.CLAMAV_HOST,
  clamavPort: env.CLAMAV_PORT,
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
};
