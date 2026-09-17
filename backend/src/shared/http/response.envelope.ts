import type {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  CollectionMeta,
  ApiErrorResponse,
} from "../types/api.types.js";

/**
 * Standard single-entity or action response envelope.
 */
export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  meta?: Record<string, unknown>
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
    requestId,
  };
}

/**
 * Standard collection/paginated response envelope.
 * Exposes meta.pagination as authoritative while preserving top-level
 * pagination keys for backward compatibility.
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  requestId: string,
  extraMeta?: Record<string, unknown>
): PaginatedResponse<T> {
  const collectionMeta: CollectionMeta = {
    ...pagination,
    ...extraMeta,
    pagination,
  };

  return {
    success: true,
    data,
    meta: collectionMeta,
    requestId,
  };
}

/**
 * Standard error response envelope.
 */
export function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    requestId,
  };
}
