// ---------------------------------------------------------------------------
// Application error hierarchy.
// All errors that cross the HTTP boundary must produce a sanitized response.
// Stack traces, Prisma internals, SQL, and filesystem paths must never be
// returned to the client — they belong in structured logs only.
// ---------------------------------------------------------------------------

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/** Base application error. Extend this — never throw raw JS Errors from app code. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  /** Operational = expected failure (user input, not-found, rate-limit, …).
   *  Non-operational = programming error or unknown third-party failure. */
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ---------------------------------------------------------------------------
// 400 Bad Request
// ---------------------------------------------------------------------------

export class ValidationError extends AppError {
  constructor(
    message = "Request validation failed",
    details?: ValidationErrorDetail[]
  ) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

// ---------------------------------------------------------------------------
// 401 Unauthorized — not authenticated
// ---------------------------------------------------------------------------

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required to access this resource") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

// ---------------------------------------------------------------------------
// 403 Forbidden — authenticated but not permitted
// ---------------------------------------------------------------------------

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

// ---------------------------------------------------------------------------
// 404 Not Found
// ---------------------------------------------------------------------------

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(404, "NOT_FOUND", message, details);
    this.name = "NotFoundError";
  }
}

// ---------------------------------------------------------------------------
// 409 Conflict
// ---------------------------------------------------------------------------

export class ConflictError extends AppError {
  constructor(message = "The request conflicts with existing data", details?: unknown) {
    super(409, "CONFLICT", message, details);
    this.name = "ConflictError";
  }
}

// ---------------------------------------------------------------------------
// 413 Request Entity Too Large
// ---------------------------------------------------------------------------

export class RequestTooLargeError extends AppError {
  constructor(message = "The request payload is too large") {
    super(413, "REQUEST_TOO_LARGE", message);
    this.name = "RequestTooLargeError";
  }
}

// ---------------------------------------------------------------------------
// 429 Rate Limited
// ---------------------------------------------------------------------------

export class RateLimitedError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, "RATE_LIMITED", message);
    this.name = "RateLimitedError";
  }
}

// ---------------------------------------------------------------------------
// 500 Internal Server Error
// ---------------------------------------------------------------------------

export class InternalServerError extends AppError {
  constructor(
    message = "An unexpected error occurred",
    details?: unknown,
    isOperational = false
  ) {
    super(500, "INTERNAL_ERROR", message, details, isOperational);
    this.name = "InternalServerError";
  }
}

// ---------------------------------------------------------------------------
// 503 Service Unavailable
// ---------------------------------------------------------------------------

export class ServiceUnavailableError extends AppError {
  constructor(message = "The service is temporarily unavailable") {
    super(503, "SERVICE_UNAVAILABLE", message);
    this.name = "ServiceUnavailableError";
  }
}
