import { QueryClient } from "@tanstack/react-query";
import {
  isUnauthorizedError,
  isForbiddenError,
  isNotFoundError,
  isValidationError,
  isConflictError,
  isApiError,
} from "@/services/api/api.errors";

/**
 * Phase 05 — Production-Grade QueryClient Configuration
 * Implements safe retry policies:
 * - Never auto-retry mutations (prevents accidental duplicate side effects)
 * - Never retry deterministic 4xx client errors (400, 401, 403, 404, 409, 422)
 * - Retry only transient network / 5xx gateway errors up to 2 times
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes (garbage collection)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;

        // Never retry known client errors
        if (
          isUnauthorizedError(error) ||
          isForbiddenError(error) ||
          isNotFoundError(error) ||
          isValidationError(error) ||
          isConflictError(error)
        ) {
          return false;
        }

        if (isApiError(error) && error.status && error.status >= 400 && error.status < 500) {
          return false;
        }

        // Retry transient network or 5xx server failures
        return true;
      },
    },
    mutations: {
      // Strictly prevent automatic retries on mutations to protect idempotency and prevent duplicate side effects
      retry: 0,
    },
  },
});
