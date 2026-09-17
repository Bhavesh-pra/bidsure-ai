/**
 * Phase 05 — Normalized Frontend API Errors & Type Guards
 */

export interface ApiErrorOptions {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
  requestId?: string;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.requestId = options.requestId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Type guard to check if an unknown error is an ApiError.
 */
export function isApiError(err: unknown): err is ApiError {
  return (
    err instanceof ApiError ||
    (typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name: string }).name === "ApiError" &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string")
  );
}

/**
 * Checks if error is a 401 Unauthorized error.
 */
export function isUnauthorizedError(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return err.status === 401 || err.code === "UNAUTHORIZED";
}

/**
 * Checks if error is a 403 Forbidden error.
 */
export function isForbiddenError(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return err.status === 403 || err.code === "FORBIDDEN";
}

/**
 * Checks if error is a 404 Not Found error.
 */
export function isNotFoundError(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return err.status === 404 || err.code === "NOT_FOUND";
}

/**
 * Checks if error is a 400 Validation Error.
 */
export function isValidationError(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return err.status === 400 || err.code === "VALIDATION_ERROR";
}

/**
 * Checks if error is a 409 Conflict or Idempotency Conflict error.
 */
export function isConflictError(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return (
    err.status === 409 ||
    err.code === "CONFLICT" ||
    err.code === "IDEMPOTENCY_CONFLICT" ||
    err.code === "CONCURRENT_REQUEST"
  );
}

/**
 * Checks if error is a Network / connection failure.
 */
export function isNetworkError(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return err.code === "NETWORK_ERROR" || err.status === undefined;
}

/**
 * Checks if error is a 429 Rate Limit error.
 */
export function isRateLimitError(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return err.status === 429 || err.code === "TOO_MANY_REQUESTS";
}
