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

export interface HealthData {
  status: "ok";
  service: string;
  version: string;
}

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
