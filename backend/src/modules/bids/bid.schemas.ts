import { z } from "zod";

export const getBidsQuerySchema = z.object({
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
  tenderId: z.string().uuid("tenderId must be a valid UUID").optional(),
});

export const bidIdParamSchema = z.object({
  id: z.string().uuid("Invalid bid ID format: must be a valid UUID"),
});

export type GetBidsQuery = z.infer<typeof getBidsQuerySchema>;
export type BidIdParam = z.infer<typeof bidIdParamSchema>;

