import { z } from "zod";

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
});

export const bidIdParamSchema = z.object({
  id: z.string().uuid("Invalid bid ID format: must be a valid UUID"),
});

export type GetBidsQuery = z.infer<typeof getBidsQuerySchema>;
export type BidIdParam = z.infer<typeof bidIdParamSchema>;

