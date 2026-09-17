// pino-http ESM compat: the package exports a function as the default,
// but TypeScript NodeNext resolution requires this import style.
import pinoHttpPkg from "pino-http";
import { logger } from "../infrastructure/logging/logger.js";
import type { IncomingMessage } from "node:http";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinoHttp = (pinoHttpPkg as any).default ?? pinoHttpPkg;

// ---------------------------------------------------------------------------
// HTTP request/response structured logging via pino-http.
// Captures: timestamp, level, requestId, method, url, status, duration.
// Redacts: Authorization header and Cookie header (never log credentials).
// ---------------------------------------------------------------------------

export const httpLoggerMiddleware = pinoHttp({
  logger,

  // Redact sensitive headers — do not log auth tokens or cookies
  redact: ["req.headers.authorization", "req.headers.cookie"],

  // Suppress health check noise in production to reduce log volume
  autoLogging: {
    ignore: (req: IncomingMessage) =>
      req.url === "/api/v1/health" && process.env["NODE_ENV"] === "production",
  },
});
