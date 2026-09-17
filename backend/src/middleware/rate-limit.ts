import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";
import type { Request, Response } from "express";
import type { ApiErrorResponse } from "../shared/types/api.types.js";

// ---------------------------------------------------------------------------
// Baseline API rate limiter.
// Policy: configurable via RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX env vars.
// Default: 100 requests per 60 seconds per IP (per env defaults).
//
// Returns the standard API error envelope on limit exceeded.
// Includes the request/correlation ID for support tracing.
// ---------------------------------------------------------------------------

export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,   // Return RateLimit-* headers
  legacyHeaders: false,    // Disable X-RateLimit-* headers

  // Skip rate limiting in test environment to avoid test flakiness
  skip: () => config.isTest,

  handler: (req: Request, res: Response) => {
    const requestId = req.requestId ?? "req_unknown";

    const responsePayload: ApiErrorResponse = {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
      requestId,
    };

    res.status(429).json(responsePayload);
  },
});
