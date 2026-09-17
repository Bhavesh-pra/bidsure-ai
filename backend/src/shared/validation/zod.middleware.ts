import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ValidationError, type ValidationErrorDetail } from "../errors/app-error.js";

/**
 * Validates req.body against a Zod schema.
 * Replaces req.body with the parsed/coerced data on success.
 * Throws ValidationError (HTTP 400) on failure.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details: ValidationErrorDetail[] = result.error.issues.map((issue) => {
        const path = issue.path.join(".") || "body";
        return {
          field: path,
          path,
          message: issue.message,
        };
      });
      return next(new ValidationError("Request body validation failed", details));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 * In Express 5, req.query is a getter property; Object.defineProperty overrides it cleanly.
 * Throws ValidationError (HTTP 400) on failure.
 */
export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details: ValidationErrorDetail[] = result.error.issues.map((issue) => {
        const path = issue.path.join(".") || "query";
        return {
          field: path,
          path,
          message: issue.message,
        };
      });
      return next(new ValidationError("Request query validation failed", details));
    }
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}

/**
 * Validates req.params against a Zod schema.
 * In Express 5, Object.defineProperty overrides req.params cleanly.
 * Throws ValidationError (HTTP 400) on failure.
 */
export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const details: ValidationErrorDetail[] = result.error.issues.map((issue) => {
        const path = issue.path.join(".") || "params";
        return {
          field: path,
          path,
          message: issue.message,
        };
      });
      return next(new ValidationError("Request parameter validation failed", details));
    }
    Object.defineProperty(req, "params", {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}
