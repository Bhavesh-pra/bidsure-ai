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
  search: z.string().trim().max(100, "Search query cannot exceed 100 characters").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
  category: z.string().trim().max(100, "Category cannot exceed 100 characters").optional(),
  department: z.string().trim().max(100, "Department cannot exceed 100 characters").optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "referenceNumber", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const tenderIdParamSchema = z.object({
  id: z.string().uuid("Invalid tender ID format: must be a valid UUID"),
});

export const tenderVersionParamSchema = z.object({
  id: z.string().uuid("Invalid tender ID format: must be a valid UUID"),
  versionId: z.string().uuid("Invalid version ID format: must be a valid UUID"),
});

export const createTenderSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  referenceNumber: z
    .string()
    .trim()
    .min(3, "Reference number must be at least 3 characters")
    .max(50, "Reference number cannot exceed 50 characters")
    .regex(/^[A-Za-z0-9\-_/]+$/, "Reference number must contain only letters, numbers, hyphens, and slashes"),
  description: z.string().trim().max(2000, "Description cannot exceed 2000 characters").optional(),
  category: z.string().trim().max(100, "Category cannot exceed 100 characters").optional(),
  department: z.string().trim().max(100, "Department cannot exceed 100 characters").optional(),
  submissionDeadline: z.string().datetime("Submission deadline must be a valid ISO-8601 date").optional(),
  budget: z.number().min(0, "Budget must be a non-negative number").optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  organizationId: z.string().uuid("Organization ID must be a valid UUID").optional(),
});

export const updateTenderMetadataSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  category: z.string().trim().max(100, "Category cannot exceed 100 characters").optional(),
  department: z.string().trim().max(100, "Department cannot exceed 100 characters").optional(),
  expectedVersion: z.number().int().min(1).optional(),
});

export const createTenderVersionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  description: z.string().trim().max(2000, "Description cannot exceed 2000 characters").optional(),
  changeSummary: z.string().trim().max(500, "Change summary cannot exceed 500 characters").optional(),
  submissionDeadline: z.string().datetime("Submission deadline must be a valid ISO-8601 date").optional(),
  budget: z.number().min(0, "Budget must be a non-negative number").optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  expectedCurrentVersionId: z.string().uuid("Expected current version ID must be a valid UUID").optional(),
});

export type GetTendersQuery = z.infer<typeof getTendersQuerySchema>;
export type TenderIdParam = z.infer<typeof tenderIdParamSchema>;
export type TenderVersionParam = z.infer<typeof tenderVersionParamSchema>;
export type CreateTenderPayload = z.infer<typeof createTenderSchema>;
export type UpdateTenderMetadataPayload = z.infer<typeof updateTenderMetadataSchema>;
export type CreateTenderVersionPayload = z.infer<typeof createTenderVersionSchema>;
