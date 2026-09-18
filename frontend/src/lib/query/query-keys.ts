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
    versions: (id: string) => [...queryKeys.tenders.detail(id), "versions"] as const,
    version: (id: string, versionId: string) =>
      [...queryKeys.tenders.detail(id), "versions", versionId] as const,
    requirements: (id: string, versionId?: string) =>
      [...queryKeys.tenders.detail(id), "requirements", versionId ?? "current"] as const,
  },
  bids: {
    all: ["bids"] as const,
    lists: () => [...queryKeys.bids.all, "list"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.bids.lists(), params ?? {}] as const,
    details: () => [...queryKeys.bids.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.bids.details(), id] as const,
  },
  requirements: {
    all: ["requirements"] as const,
    catalog: () => ["requirements", "catalog"] as const,
    byTenderVersion: (tenderId: string, versionId: string, params?: Record<string, unknown>) =>
      ["requirements", "tender", tenderId, "version", versionId, params ?? {}] as const,
    detail: (id: string) => ["requirements", "detail", id] as const,
    versions: (id: string) => ["requirements", "versions", id] as const,
  },
} as const;
