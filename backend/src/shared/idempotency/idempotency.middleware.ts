import type { Request, Response, NextFunction } from "express";
import { idempotencyService, IdempotencyService } from "./idempotency.service.js";
import { ValidationError, UnauthorizedError } from "../errors/app-error.js";

export interface IdempotencyMiddlewareOptions {
  /** If false, allows requests without Idempotency-Key to proceed normally. Defaults to true. */
  required?: boolean;
}

/**
 * Route-scoped idempotency middleware.
 * Guarantees that duplicate requests with the same Idempotency-Key return
 * the identical stored result without repeating side effects.
 *
 * Concurrency-safe: Exactly one concurrent request executes; simultaneous duplicates receive 409 CONCURRENT_REQUEST.
 */
export function requireIdempotency(
  options: IdempotencyMiddlewareOptions = { required: true },
  service: IdempotencyService = idempotencyService
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = req.headers["idempotency-key"];
    const key = typeof rawKey === "string" ? rawKey.trim() : undefined;

    if (!key) {
      if (options.required === false) {
        return next();
      }
      return next(
        new ValidationError("Idempotency-Key header is required for this operation", [
          { field: "headers.idempotency-key", message: "Idempotency-Key header cannot be empty" },
        ])
      );
    }

    // Tenant context and user must be authenticated before idempotency is evaluated
    if (!req.tenant?.organizationId || !req.user?.id) {
      return next(new UnauthorizedError("Authentication is required for idempotent operations"));
    }

    const organizationId = req.tenant.organizationId;
    const userId = req.user.id;
    const method = req.method;
    const endpoint = req.baseUrl + req.path;

    try {
      const requestHash = service.computeRequestHash(method, endpoint, req.body);

      const lock = await service.acquireLock({
        organizationId,
        userId,
        key,
        method,
        endpoint,
        requestHash,
      });

      // Stored response replay
      if (lock.isReplay) {
        res.setHeader("x-idempotent-replay", "true");
        const status = lock.statusCode ?? 200;

        if (status === 204 || lock.responseBody === null || lock.responseBody === undefined) {
          res.status(status).end();
          return;
        }

        res.status(status).json(lock.responseBody);
        return;
      }

      // First execution: intercept res.json / res.send to capture response on completion
      const originalJson = res.json.bind(res);
      const originalEnd = res.end.bind(res);

      let completed = false;

      res.json = function (body: unknown): Response {
        if (!completed) {
          completed = true;
          // Store completion in background without blocking client response
          service
            .completeLock({
              organizationId,
              key,
              statusCode: res.statusCode,
              responseBody: body,
            })
            .catch(() => {
              // Best-effort completion persistence
            });
        }
        return originalJson(body);
      };

      res.end = function (...args: unknown[]): Response {
        if (!completed) {
          completed = true;
          service
            .completeLock({
              organizationId,
              key,
              statusCode: res.statusCode,
              responseBody: res.statusCode === 204 ? null : undefined,
            })
            .catch(() => {
              // Best-effort completion persistence
            });
        }
        return (originalEnd as (...a: unknown[]) => Response)(...args);
      };

      next();
    } catch (err) {
      // If lock was acquired but an error occurred before completion
      await service.releaseLockOnError(organizationId, key);
      next(err);
    }
  };
}
