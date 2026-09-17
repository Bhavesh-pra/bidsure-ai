export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
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

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
  requestId?: string;
}

export interface HealthData {
  status: "ok" | string;
  service: string;
  version: string;
}

export type HealthResponse = ApiResponse<HealthData>;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  requestId: string;
}
