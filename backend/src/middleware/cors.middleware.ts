import cors from "cors";
import { config } from "../config/env.js";

// ---------------------------------------------------------------------------
// CORS — explicit allowlist only.
// Reflecting any incoming Origin header (the Phase 01 behavior) is a
// security flaw; it allows arbitrary origins to make credentialed requests.
//
// In development: allow the configured FRONTEND_ORIGIN (default: localhost:5173).
// In production:  allow only the explicitly configured FRONTEND_ORIGIN.
//
// NOTE: Vite's dev proxy sends requests server-to-server (no Origin header),
// so proxied requests are unaffected by this policy.
// ---------------------------------------------------------------------------

const allowedOrigins = new Set([config.frontendOrigin]);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Vite proxy, curl, test runners)
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not permitted`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-request-id",
    "x-correlation-id",
  ],
  exposedHeaders: ["x-request-id", "x-correlation-id"],
  credentials: true,
  // 10 minutes preflight cache
  maxAge: 600,
});
