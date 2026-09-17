import { z } from "zod";

export const getTendersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((v) => Math.max(1, parseInt(v, 10) || 1)),
  pageSize: z
    .string()
    .optional()
    .default("10")
    .transform((v) => Math.min(50, Math.max(1, parseInt(v, 10) || 10))),
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

