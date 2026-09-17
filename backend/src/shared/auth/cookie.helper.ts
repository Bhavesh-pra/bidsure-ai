import type { Request, Response } from "express";
import { config } from "../../config/env.js";

export const SESSION_COOKIE_NAME = "bidsure_session";

/**
 * Parse standard cookie header into key-value map.
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

/**
 * Extract session token from request cookies.
 */
export function getSessionTokenFromRequest(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  // Authorization: Bearer token is strictly test/development-only.
  // In production, browser authentication uses HttpOnly cookie exclusively.
  if (!config.isProd && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0]?.toLowerCase() === "bearer" && parts[1]) {
      return parts[1];
    }
  }

  return null;
}

/**
 * Attach HttpOnly session cookie to response.
 */
export function setSessionCookie(res: Response, sessionToken: string): void {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Clear HttpOnly session cookie from response.
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    path: "/",
  });
}
