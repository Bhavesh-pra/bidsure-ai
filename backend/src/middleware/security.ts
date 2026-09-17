import helmet from "helmet";
import { config } from "../config/env.js";

// ---------------------------------------------------------------------------
// Security headers via Helmet.
// CSP is deliberately relaxed in development to allow Vite HMR.
// In production, tighten the CSP to match your actual deployment.
// ---------------------------------------------------------------------------

export const securityMiddleware = helmet({
  // Content-Security-Policy
  contentSecurityPolicy: config.isProd
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      }
    : false, // Disabled in development — Vite HMR requires loose CSP

  // X-Content-Type-Options: nosniff
  noSniff: true,

  // X-DNS-Prefetch-Control: off
  dnsPrefetchControl: { allow: false },

  // Referrer-Policy: strict-origin-when-cross-origin
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  // X-Frame-Options: DENY (superseded by CSP frame-ancestors in modern browsers)
  frameguard: { action: "deny" },

  // Strict-Transport-Security (HSTS) — only meaningful over HTTPS in production
  hsts: config.isProd
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,

  // X-Permitted-Cross-Domain-Policies: none
  permittedCrossDomainPolicies: { permittedPolicies: "none" },

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: { policy: "same-origin" },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: "same-origin" },
});
