import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/query/query-keys";
import { queryClient } from "@/lib/query/query-client";
import { ApiError } from "@/services/api/api.errors";

describe("Phase 05 — TanStack Query Infrastructure", () => {
  describe("Query Key Factory", () => {
    it("produces deterministic auth query keys", () => {
      expect(queryKeys.auth.all).toEqual(["auth"]);
      expect(queryKeys.auth.session()).toEqual(["auth", "session"]);
    });

    it("produces deterministic tenders query keys", () => {
      expect(queryKeys.tenders.all).toEqual(["tenders"]);
      expect(queryKeys.tenders.lists()).toEqual(["tenders", "list"]);
      expect(queryKeys.tenders.list({ page: 1, pageSize: 10 })).toEqual([
        "tenders",
        "list",
        { page: 1, pageSize: 10 },
      ]);
      expect(queryKeys.tenders.details()).toEqual(["tenders", "detail"]);
      expect(queryKeys.tenders.detail("tender-uuid-123")).toEqual([
        "tenders",
        "detail",
        "tender-uuid-123",
      ]);
    });

    it("produces deterministic bids query keys", () => {
      expect(queryKeys.bids.all).toEqual(["bids"]);
      expect(queryKeys.bids.lists()).toEqual(["bids", "list"]);
      expect(queryKeys.bids.list({ tenderId: "tender-123" })).toEqual([
        "bids",
        "list",
        { tenderId: "tender-123" },
      ]);
      expect(queryKeys.bids.detail("bid-uuid-456")).toEqual([
        "bids",
        "detail",
        "bid-uuid-456",
      ]);
    });
  });

  describe("QueryClient Default Options & Retry Policy", () => {
    const defaultQueryOptions = queryClient.getDefaultOptions().queries;
    const defaultMutationOptions = queryClient.getDefaultOptions().mutations;

    it("configures standard cache lifetimes", () => {
      expect(defaultQueryOptions?.staleTime).toBe(1000 * 60 * 2); // 2 minutes
      expect(defaultQueryOptions?.gcTime).toBe(1000 * 60 * 5); // 5 minutes
      expect(defaultQueryOptions?.refetchOnWindowFocus).toBe(false);
    });

    it("enforces mutation retry: 0 to prevent unintended side effects", () => {
      expect(defaultMutationOptions?.retry).toBe(0);
    });

    it("retry function rejects client errors immediately", () => {
      const retryFn = defaultQueryOptions?.retry as (failureCount: number, error: unknown) => boolean;
      expect(typeof retryFn).toBe("function");

      const err401 = new ApiError({ code: "UNAUTHORIZED", message: "Unauthorized", status: 401 });
      const err403 = new ApiError({ code: "FORBIDDEN", message: "Forbidden", status: 403 });
      const err404 = new ApiError({ code: "NOT_FOUND", message: "Not found", status: 404 });
      const err400 = new ApiError({ code: "VALIDATION_ERROR", message: "Bad data", status: 400 });
      const err409 = new ApiError({ code: "IDEMPOTENCY_CONFLICT", message: "Conflict", status: 409 });

      expect(retryFn(0, err401)).toBe(false);
      expect(retryFn(0, err403)).toBe(false);
      expect(retryFn(0, err404)).toBe(false);
      expect(retryFn(0, err400)).toBe(false);
      expect(retryFn(0, err409)).toBe(false);
    });

    it("retry function retries transient network / 5xx failures up to 2 times", () => {
      const retryFn = defaultQueryOptions?.retry as (failureCount: number, error: unknown) => boolean;

      const networkErr = new ApiError({ code: "NETWORK_ERROR", message: "Failed to connect" });
      const serverErr = new ApiError({ code: "INTERNAL_ERROR", message: "Server error", status: 500 });

      // First failure (failureCount = 0): should retry
      expect(retryFn(0, networkErr)).toBe(true);
      expect(retryFn(0, serverErr)).toBe(true);

      // Second failure (failureCount = 1): should retry
      expect(retryFn(1, networkErr)).toBe(true);

      // Third failure (failureCount = 2): should STOP retrying
      expect(retryFn(2, networkErr)).toBe(false);
      expect(retryFn(2, serverErr)).toBe(false);
    });
  });
});
