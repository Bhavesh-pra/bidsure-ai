import type { TenantContext } from "../auth/tenant-context.js";
import { UnauthorizedError } from "../errors/app-error.js";

/**
 * Base repository utilities enforcing tenant isolation and deterministic ordering.
 */
export class BaseRepository {
  /**
   * Asserts that a valid tenant context with organizationId is present.
   * Throws UnauthorizedError if missing.
   */
  protected requireTenant(tenant?: TenantContext): TenantContext & { organizationId: string } {
    if (!tenant?.organizationId) {
      throw new UnauthorizedError("Authoritative tenant context is required for this operation");
    }
    return tenant as TenantContext & { organizationId: string };
  }

  /**
   * Generates a deterministic order-by clause with secondary sort on unique id
   * to guarantee stable pagination results across queries.
   */
  protected deterministicOrder(primaryColumn = "createdAt", direction: "asc" | "desc" = "desc") {
    return [
      { [primaryColumn]: direction },
      { id: "asc" },
    ] as const;
  }
}
