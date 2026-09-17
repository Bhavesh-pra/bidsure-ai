import { z } from "zod";

export const getTendersQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  pageSize: z.coerce
    .number()
    .int("Page size must be an integer")
    .min(1, "Page size must be at least 1")
    .max(100, "Page size cannot exceed 100")
    .default(10),
});

export const tenderIdParamSchema = z.object({
  id: z.string().uuid("Invalid tender ID format: must be a valid UUID"),
});

export const createTenderSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  referenceNumber: z
    .string()
    .min(3, "Reference number must be at least 3 characters")
    .max(50, "Reference number cannot exceed 50 characters")
    .regex(/^[A-Za-z0-9\-_/]+$/, "Reference number must contain only letters, numbers, hyphens, and slashes"),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
  organizationId: z.string().uuid("Organization ID must be a valid UUID").optional(),
});

export type GetTendersQuery = z.infer<typeof getTendersQuerySchema>;
export type TenderIdParam = z.infer<typeof tenderIdParamSchema>;
export type CreateTenderPayload = z.infer<typeof createTenderSchema>;

