/**
 * Phase 05 — Centralized TanStack Query Key Factory
 * Enforces predictable, hierarchical cache invalidation.
 */

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },
  tenders: {
    all: ["tenders"] as const,
    lists: () => [...queryKeys.tenders.all, "list"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.tenders.lists(), params ?? {}] as const,
    details: () => [...queryKeys.tenders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tenders.details(), id] as const,
  },
  bids: {
    all: ["bids"] as const,
    lists: () => [...queryKeys.bids.all, "list"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.bids.lists(), params ?? {}] as const,
    details: () => [...queryKeys.bids.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.bids.details(), id] as const,
  },
} as const;
