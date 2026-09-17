import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Request / Correlation ID middleware.
// Every request gets a unique ID. If a valid x-request-id is supplied it is
// reused (after validation). The ID is attached to req, returned in the
// response header, and available for structured logging.
// ---------------------------------------------------------------------------

const REQ_ID_REGEX = /^req_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Augment Express.Request so all downstream code can rely on req.requestId: string
declare global {
  namespace Express {
    interface Request {
      /** Application-level request ID (always a formatted string) */
      requestId: string;
      correlationId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingRequestId = req.headers["x-request-id"];
  let requestId: string;

  if (typeof incomingRequestId === "string" && REQ_ID_REGEX.test(incomingRequestId)) {
    requestId = incomingRequestId;
  } else {
    requestId = `req_${randomUUID()}`;
  }

  req.requestId = requestId;
  // Also set the built-in Express req.id for compatibility
  req.id = requestId;
  res.setHeader("x-request-id", requestId);

  const incomingCorrId = req.headers["x-correlation-id"];
  if (typeof incomingCorrId === "string" && incomingCorrId.trim().length > 0) {
    const correlationId = incomingCorrId.startsWith("corr_")
      ? incomingCorrId
      : `corr_${incomingCorrId}`;
    req.correlationId = correlationId;
    res.setHeader("x-correlation-id", correlationId);
  }

  next();
};
