import type { Request, Response, NextFunction } from "express";
import { getSessionTokenFromRequest } from "../shared/auth/cookie.helper.js";
import { sessionService, type AuthenticatedUser } from "../shared/auth/session.service.js";
import { createTenantContext, type TenantContext } from "../shared/auth/tenant-context.js";
import { can, type Action, type ResourceType } from "../shared/auth/permissions.js";
import { UnauthorizedError, ForbiddenError } from "../shared/errors/app-error.js";
import type { Role } from "@prisma/client";

// Module augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant?: TenantContext;
    }
  }
}

/**
 * Authentication Middleware.
 *
 * Responsibilities:
 * 1. Extract session token (HttpOnly cookie bidsure_session; fallback to Bearer in test/dev only).
 * 2. Validate session against PostgreSQL sessions table (hashed token lookup).
 * 3. Verify user status is ACTIVE (reject INACTIVE / SUSPENDED).
 * 4. Verify organization status is ACTIVE.
 * 5. Attach trusted identity to `req.user` and trusted tenant context to `req.tenant`.
 * 6. Reject unauthenticated requests with HTTP 401.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) {
      throw new UnauthorizedError("Authentication is required to access this resource");
    }

    const session = await sessionService.validateSession(token);
    if (!session) {
      throw new UnauthorizedError("Invalid or expired session. Please sign in again.");
    }

    req.user = session.user;
    req.tenant = createTenantContext(session.user);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-Based Access Guard Middleware.
 * Denies requests if user role is not in the allowed roles list.
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication is required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to access this resource"));
    }

    next();
  };
};

/**
 * Centralized Authorization Policy Guard Middleware.
 * Evaluates `can(req.user, action, resource)`.
 */
export const requirePermission = (action: Action, resource: ResourceType) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication is required"));
    }

    const allowed = can(req.user, action, resource);
    if (!allowed) {
      return next(
        new ForbiddenError(
          `You do not have permission to perform ${action} on ${resource}`
        )
      );
    }

    next();
  };
};
