import { z } from "zod";
import { RequirementCategory, RequirementOperator, RequirementStatus } from "@prisma/client";
import { isValidRuleId } from "./requirement.rule-catalog.js";

export const requirementCategoryEnum = z.nativeEnum(RequirementCategory);
export const requirementOperatorEnum = z.nativeEnum(RequirementOperator);
export const requirementStatusEnum = z.nativeEnum(RequirementStatus);

export const requirementIdParamSchema = z.object({
  id: z.string().uuid("Invalid requirement ID format"),
});

export const tenderVersionParamSchema = z.object({
  tenderId: z.string().uuid("Invalid tender ID format"),
  versionId: z.string().uuid("Invalid tender version ID format"),
});

export const extractRequirementsSchema = z.object({
  documentId: z.string().uuid("Invalid document ID format").optional(),
});

export const listRequirementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: requirementStatusEnum.optional(),
  category: requirementCategoryEnum.optional(),
  mandatory: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  ruleMapped: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  confidenceTier: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(["createdAt", "identifier", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const updateRequirementSchema = z.object({
  expectedCurrentVersionId: z.string().uuid("expectedCurrentVersionId is required for optimistic concurrency"),
  title: z.string().trim().min(3).max(255).optional(),
  description: z.string().trim().min(5).max(5000).optional(),
  category: requirementCategoryEnum.optional(),
  mandatory: z.boolean().optional(),
  condition: z.string().trim().max(1000).optional().nullable(),
  operator: requirementOperatorEnum.optional().nullable(),
  threshold: z.record(z.string(), z.unknown()).optional().nullable(),
  expectedValue: z.string().trim().max(500).optional().nullable(),
  requiredEvidenceType: z.string().trim().max(100).optional().nullable(),
  sourceClause: z.string().trim().max(100).optional().nullable(),
  sourcePage: z.number().int().positive().optional().nullable(),
  sourceText: z.string().trim().max(5000).optional().nullable(),
});

export const approveRequirementSchema = z.object({
  expectedCurrentVersionId: z.string().uuid("expectedCurrentVersionId is required for optimistic concurrency"),
  notes: z.string().trim().max(1000).optional(),
});

export const rejectRequirementSchema = z.object({
  expectedCurrentVersionId: z.string().uuid("expectedCurrentVersionId is required for optimistic concurrency"),
  rejectionReason: z
    .string()
    .trim()
    .min(5, "Rejection reason must be at least 5 characters"),
});

export const mapRuleSchema = z.object({
  expectedCurrentVersionId: z.string().uuid("expectedCurrentVersionId is required for optimistic concurrency"),
  ruleId: z
    .string()
    .refine((val) => isValidRuleId(val), {
      message: "Unknown rule ID. Rule must be from the controlled compliance rule catalog.",
    }),
  ruleVersion: z.number().int().positive().default(1),
  operator: requirementOperatorEnum.optional().nullable(),
  expectedValue: z.string().trim().max(500).optional().nullable(),
  parameters: z.record(z.string(), z.unknown()).default({}),
});

export const createRequirementSchema = z.object({
  tenderId: z.string().uuid("Invalid tender ID").optional(),
  tenderVersionId: z.string().uuid("Invalid tender version ID").optional(),
  identifier: z.string().trim().min(1).max(100),
  category: requirementCategoryEnum.default(RequirementCategory.OTHER),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(5).max(5000),
  mandatory: z.boolean().default(true),
  condition: z.string().trim().max(1000).optional().nullable(),
  operator: requirementOperatorEnum.optional().nullable(),
  threshold: z.record(z.string(), z.unknown()).optional().nullable(),
  expectedValue: z.string().trim().max(500).optional().nullable(),
  requiredEvidenceType: z.string().trim().max(100).optional().nullable(),
  sourceClause: z.string().trim().max(100).optional().nullable(),
  sourcePage: z.number().int().positive().optional().nullable(),
  sourceText: z.string().trim().max(5000).optional().nullable(),
  sourceDocumentId: z.string().uuid().optional().nullable(),
});

export const createRequirementVersionSchema = z.object({
  expectedCurrentVersionId: z.string().uuid("expectedCurrentVersionId is required for optimistic concurrency"),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(5).max(5000),
  category: requirementCategoryEnum.default(RequirementCategory.OTHER),
  mandatory: z.boolean().default(true),
  condition: z.string().trim().max(1000).optional().nullable(),
  operator: requirementOperatorEnum.optional().nullable(),
  threshold: z.record(z.string(), z.unknown()).optional().nullable(),
  expectedValue: z.string().trim().max(500).optional().nullable(),
  requiredEvidenceType: z.string().trim().max(100).optional().nullable(),
  sourceClause: z.string().trim().max(100).optional().nullable(),
  sourcePage: z.number().int().positive().optional().nullable(),
  sourceText: z.string().trim().max(5000).optional().nullable(),
  changeSummary: z.string().trim().max(500).optional(),
});
