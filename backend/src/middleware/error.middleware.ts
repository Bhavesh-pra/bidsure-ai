import type { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/app-error.js";
import type { ApiErrorResponse } from "../shared/types/api.types.js";
import { logger } from "../infrastructure/logging/logger.js";
import { config } from "../config/env.js";

// ---------------------------------------------------------------------------
// Centralized error handler — Express 4-arg error middleware.
// CONTRACT: All HTTP responses from this handler are sanitized.
// Stack traces, SQL, Prisma internals, and filesystem paths stay in logs.
// ---------------------------------------------------------------------------

/** Classify an error body for logging without leaking sensitive internals. */
function extractSafeLogContext(err: unknown): { errorType: string; stack?: string } {
  if (err instanceof AppError) {
    const result: { errorType: string; stack?: string } = { errorType: err.name };
    if (config.isDev && err.stack !== undefined) result.stack = err.stack;
    return result;
  }
  if (err instanceof Error) {
    const result: { errorType: string; stack?: string } = {
      errorType: err.constructor.name || "Error",
    };
    if (config.isDev && err.stack !== undefined) result.stack = err.stack;
    return result;
  }
  return { errorType: typeof err };
}

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  // Express requires _next in the signature for error middleware detection
  _next: NextFunction
): void => {
  const requestId = req.requestId ?? "req_unknown";

  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  let details: unknown = undefined;

  // ---------------------------------------------------------------------------
  // Handle express body-parser PayloadTooLargeError
  // ---------------------------------------------------------------------------
  if (
    err &&
    typeof err === "object" &&
    "type" in err &&
    (err as { type: string }).type === "entity.too.large"
  ) {
    statusCode = 413;
    code = "REQUEST_TOO_LARGE";
    message = "Request payload exceeds the allowed size limit";
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    // Only include details if they are safe (no internal stack/path leakage)
    details = err.details;
  } else if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    (err as { code: string }).code.startsWith("P")
  ) {
    const prismaCode = (err as { code: string }).code;
    if (prismaCode === "P2002") {
      statusCode = 409;
      code = "CONFLICT";
      message = "A resource with this unique attribute already exists";
    } else if (prismaCode === "P2025") {
      statusCode = 404;
      code = "NOT_FOUND";
      message = "The requested database record was not found";
    } else {
      statusCode = 500;
      code = "DATABASE_ERROR";
      message = "A database error occurred";
    }
    logger.error(
      {
        requestId,
        method: req.method,
        path: req.path,
        prismaCode,
        internalMessage: err instanceof Error ? err.message : String(err),
      },
      "Sanitized database error"
    );
  } else if (err instanceof Error) {
    // Unknown JS Error — do NOT return err.message to client (may contain internals)
    message = "An unexpected error occurred";
    // Log the real message for diagnostics
    logger.error(
      {
        requestId,
        method: req.method,
        path: req.path,
        ...extractSafeLogContext(err),
        // Internal message stays in logs only
        internalMessage: err.message,
      },
      "Unhandled application error"
    );
  }

  // Log all errors at appropriate level
  const logLevel = statusCode >= 500 ? "error" : "warn";
  logger[logLevel](
    {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      errorCode: code,
      ...extractSafeLogContext(err),
    },
    `[${code}] ${statusCode}`
  );

  const responsePayload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    requestId,
  };

  res.status(statusCode).json(responsePayload);
};
