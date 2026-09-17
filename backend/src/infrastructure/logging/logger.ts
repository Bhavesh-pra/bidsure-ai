import pino from "pino";
import { config } from "../../config/env.js";

// ---------------------------------------------------------------------------
// Structured logger — Pino.
// Machine-readable JSON in production; human-friendly in development.
// NEVER log: passwords, tokens, API keys, credentials, document contents.
// ---------------------------------------------------------------------------

export const logger = pino({
  level: config.logLevel,
  // Pretty-print only in development to keep production logs parseable
  ...(config.isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
  // Redact sensitive fields if they ever appear at the top level
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "apiKey",
      "secret",
      "authorization",
      "cookie",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.apiKey",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
  base: {
    service: config.serviceName,
    version: config.version,
    env: config.nodeEnv,
  },
});
