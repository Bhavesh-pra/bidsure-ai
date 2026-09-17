import type { Role } from "@prisma/client";
import type { AuthenticatedUser } from "./session.service.js";

/**
 * Authoritative Tenant & Identity Context.
 *
 * NON-NEGOTIABLE PRINCIPLES:
 * 1. Must be established strictly from server-authenticated database identity.
 * 2. Client-supplied organizationId, userId, and role are NEVER trusted.
 * 3. Every tenant-scoped operation in repositories and services must receive this context.
 */
export interface TenantContext {
  organizationId: string;
  userId: string;
  role: Role;
  email: string;
  bidderId?: string | null | undefined;
}

/**
 * Construct verified TenantContext from authenticated user record.
 */
export function createTenantContext(user: AuthenticatedUser): TenantContext {
  return {
    organizationId: user.organizationId,
    userId: user.id,
    role: user.role,
    email: user.email,
    bidderId: user.bidderId,
  };
}
