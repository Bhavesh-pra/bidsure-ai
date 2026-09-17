/**
 * Phase 05 — Canonical API Contract Types (Frontend)
 * Perfectly aligned with backend standard response envelopes.
 */

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  requestId: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface CollectionMeta extends PaginationMeta {
  pagination: PaginationMeta;
  [key: string]: unknown;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: CollectionMeta;
  requestId: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  requestId: string;
}

export interface HealthData {
  status: "ok" | string;
  service: string;
  version: string;
}

export type HealthResponse = ApiResponse<HealthData>;
