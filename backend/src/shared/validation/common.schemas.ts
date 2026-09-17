import { z } from "zod";

/**
 * Validates a UUID parameter in req.params
 */
export function createUuidParamSchema(paramName = "id") {
  return z.object({
    [paramName]: z
      .string()
      .min(1, `${paramName} is required`)
      .uuid(`Invalid ${paramName}: must be a valid UUID`),
  });
}

/**
 * Standard pagination query parameter schema.
 * Rejects page < 1, pageSize < 1, and pageSize > 100.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be greater than or equal to 1")
    .default(1),
  pageSize: z.coerce
    .number()
    .int("Page size must be an integer")
    .min(1, "Page size must be at least 1")
    .max(100, "Page size cannot exceed 100")
    .default(20),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

/**
 * Idempotency key header validation
 */
export const idempotencyHeaderSchema = z
  .string()
  .min(1, "Idempotency-Key cannot be empty")
  .max(256, "Idempotency-Key exceeds maximum length of 256 characters");
