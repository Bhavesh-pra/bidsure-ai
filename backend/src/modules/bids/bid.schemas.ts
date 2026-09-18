import { z } from "zod";
import { BidStatus } from "@prisma/client";

export const getBidsQuerySchema = z.object({
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
  tenderId: z.string().uuid("tenderId must be a valid UUID").optional(),
  status: z.nativeEnum(BidStatus).optional(),
});

export const bidIdParamSchema = z.object({
  id: z.string().uuid("Invalid bid ID format: must be a valid UUID"),
});

export const createBidSchema = z
  .object({
    tenderId: z.string().uuid("tenderId must be a valid UUID"),
    tenderVersionId: z.string().uuid("tenderVersionId must be a valid UUID"),
    bidderId: z.string().uuid("bidderId must be a valid UUID").optional(),
    totalAmount: z
      .number()
      .positive("totalAmount must be greater than zero")
      .max(9999999999999.99, "totalAmount exceeds maximum limit")
      .nullable()
      .optional(),
    currency: z
      .string()
      .length(3)
      .default("INR"),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict();

export const updateDraftBidSchema = z
  .object({
    totalAmount: z
      .number()
      .positive("totalAmount must be greater than zero")
      .max(9999999999999.99, "totalAmount exceeds maximum limit")
      .nullable()
      .optional(),
    currency: z
      .string()
      .length(3)
      .optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    expectedVersion: z
      .number()
      .int("expectedVersion must be an integer")
      .positive("expectedVersion must be positive")
      .optional(),
  })
  .strict();

export type GetBidsQuery = z.infer<typeof getBidsQuerySchema>;
export type BidIdParam = z.infer<typeof bidIdParamSchema>;
export type CreateBidSchema = z.infer<typeof createBidSchema>;
export type UpdateDraftBidSchema = z.infer<typeof updateDraftBidSchema>;
