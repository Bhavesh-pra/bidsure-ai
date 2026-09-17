import express, { type Express } from "express";
import { corsMiddleware } from "../middleware/cors.middleware.js";
import { securityMiddleware } from "../middleware/security.js";
import { requestIdMiddleware } from "../middleware/request-id.middleware.js";
import { httpLoggerMiddleware } from "../middleware/http-logger.js";
import { rateLimitMiddleware } from "../middleware/rate-limit.js";
import { notFoundMiddleware } from "../middleware/not-found.middleware.js";
import { errorMiddleware } from "../middleware/error.middleware.js";
import { routes } from "./routes.js";

export const createApp = (): Express => {
  const app = express();

  // 1. Security Headers (Helmet) — before everything else
  app.use(securityMiddleware);

  // 2. CORS — explicit allowlist
  app.use(corsMiddleware);

  // 3. Authoritative Request ID & Tracing
  app.use(requestIdMiddleware);

  // 4. Structured HTTP Logging
  app.use(httpLoggerMiddleware);

  // 5. Rate Limiting — after request ID so rate-limit errors carry IDs
  app.use(rateLimitMiddleware);

  // 6. Body Parsing — deliberately bounded to prevent oversized request abuse
  //    50 KB covers typical JSON API payloads; Phase 08 handles document upload separately
  app.use(express.json({ limit: "50kb" }));
  app.use(express.urlencoded({ extended: false, limit: "50kb" }));

  // 7. API v1 Routing
  app.use("/api/v1", routes);

  // 8. 404 Not Found
  app.use(notFoundMiddleware);

  // 9. Global Centralized Error Handling (must be last)
  app.use(errorMiddleware);

  return app;
};
