import { Role } from "@prisma/client";
import type { AuthenticatedUser } from "./session.service.js";

export type Action =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "submit"
  | "review"
  | "audit";

export type ResourceType =
  | "tender"
  | "bid"
  | "document"
  | "user"
  | "organization"
  | "audit_log";

/**
 * Deny-by-default centralized authorization policy engine.
 *
 * Enforces:
 * 1. Role-action permissions.
 * 2. Strict separation: ADMIN ≠ PROCUREMENT_OFFICER, AUDITOR ≠ REVIEWER, BIDDER ≠ OFFICER.
 * 3. Resource ownership checks (e.g. Bidder can only access own bids).
 */
export function can(
  user: AuthenticatedUser,
  action: Action,
  resource: ResourceType,
  entity?: { organizationId?: string; bidderId?: string | null; [key: string]: unknown }
): boolean {
  // If an entity with organizationId is provided, enforce organization tenancy first
  if (entity?.organizationId && entity.organizationId !== user.organizationId) {
    return false;
  }

  switch (user.role) {
    case Role.PROCUREMENT_OFFICER:
      return canOfficer(action, resource);

    case Role.BIDDER:
      return canBidder(user, action, resource, entity);

    case Role.REVIEWER:
      return canReviewer(action, resource);

    case Role.AUDITOR:
      return canAuditor(action, resource);

    case Role.ADMIN:
      return canAdmin(action, resource);

    default:
      return false; // Deny by default
  }
}

/**
 * Procurement Officer: Manages tenders, views & reviews submitted bids in own org.
 */
function canOfficer(action: Action, resource: ResourceType): boolean {
  if (resource === "tender") {
    return ["read", "create", "update", "publish", "delete"].includes(action);
  }
  if (resource === "bid") {
    return ["read", "review"].includes(action);
  }
  if (resource === "document") {
    return ["read"].includes(action);
  }
  if (resource === "audit_log") {
    return ["read"].includes(action);
  }
  return false;
}

/**
 * Bidder: Reads solicitations, creates and reads own bids.
 * Strictly forbidden from officer actions or competitor bids.
 */
function canBidder(
  user: AuthenticatedUser,
  action: Action,
  resource: ResourceType,
  entity?: { bidderId?: string | null; [key: string]: unknown }
): boolean {
  if (resource === "tender") {
    // Bidders can only read tenders (solicitations)
    return action === "read";
  }

  if (resource === "bid") {
    if (action === "create") return true;
    if (action === "read" || action === "update" || action === "submit") {
      // If a specific bid entity is provided, enforce that it belongs to this bidder
      if (entity && "bidderId" in entity) {
        if (!user.bidderId || entity.bidderId !== user.bidderId) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  if (resource === "document") {
    return ["read", "create"].includes(action);
  }

  return false;
}

/**
 * Reviewer: Read-only evaluation of tenders and bids in own organization.
 * Cannot mutate tenders or create bids.
 */
function canReviewer(action: Action, resource: ResourceType): boolean {
  if (["tender", "bid", "document"].includes(resource)) {
    return ["read", "review"].includes(action);
  }
  return false;
}

/**
 * Auditor: Strict read-only access to organization compliance data.
 * Cannot mutate any records.
 */
function canAuditor(action: Action, resource: ResourceType): boolean {
  // Auditors can ONLY perform read/audit actions
  if (action !== "read" && action !== "audit") {
    return false;
  }
  return ["tender", "bid", "document", "audit_log"].includes(resource);
}

/**
 * Admin: Tenant administration (users, settings).
 * Forbidden from officer procurement actions (creating tenders, evaluating bids).
 */
function canAdmin(action: Action, resource: ResourceType): boolean {
  if (resource === "user" || resource === "organization") {
    return ["read", "create", "update", "delete"].includes(action);
  }
  if (resource === "audit_log") {
    return action === "read";
  }
  // Admin cannot act as procurement officer
  return false;
}
