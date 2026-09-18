import type {
  RequirementStatus,
  RequirementCategory,
  RequirementOperator,
} from "@prisma/client";

export type { RequirementStatus, RequirementCategory, RequirementOperator };

export interface RequirementSourceDTO {
  documentId: string | null;
  documentName?: string | null;
  page: number | null;
  clauseRef: string | null;
  text: string | null;
  location?: unknown | null;
}

export interface RequirementRuleMappingDTO {
  id: string;
  ruleId: string;
  ruleVersion: number;
  operator: RequirementOperator | null;
  expectedValue: string | null;
  parameters: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
}

export interface RequirementAiMetadataDTO {
  generated: boolean;
  model: string | null;
  modelVersion: string | null;
  confidence: number | null;
}

export interface RequirementVersionDTO {
  id: string;
  requirementId: string;
  tenderVersionId: string | null;
  versionNumber: number;
  status: RequirementStatus;
  category: RequirementCategory;
  title: string;
  description: string;
  mandatory: boolean;
  condition?: string | null;
  operator?: RequirementOperator | null;
  threshold?: Record<string, unknown> | null;
  expectedValue?: string | null;
  requiredEvidenceType?: string | null;
  source: RequirementSourceDTO;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  ai: RequirementAiMetadataDTO;
  createdBy?: string | null;
  createdByName?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  supersedesVersionId?: string | null;
  ruleMapping?: RequirementRuleMappingDTO | null;
  createdAt: string;
}

export interface RequirementDTO {
  id: string;
  organizationId: string | null;
  tenderId: string | null;
  tenderVersionId: string;
  identifier: string;
  category: string;
  currentVersionId: string | null;
  currentVersion: RequirementVersionDTO | null;
  versionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementProposalExtractionResult {
  proposals: Array<{
    identifier: string;
    category: RequirementCategory;
    title: string;
    description: string;
    mandatory: boolean;
    condition?: string | undefined;
    operator?: RequirementOperator | undefined;
    threshold?: Record<string, unknown> | undefined;
    expectedValue?: string | undefined;
    requiredEvidenceType?: string | undefined;
    sourceClause: string;
    sourcePage: number;
    sourceText: string;
    sourceDocumentId?: string | undefined;
    confidence: number;
    aiModel: string;
    aiModelVersion: string;
  }>;
}

export interface ListRequirementsQuery {
  page?: number;
  pageSize?: number;
  status?: RequirementStatus;
  category?: RequirementCategory;
  mandatory?: boolean;
  ruleMapped?: boolean;
  confidenceTier?: "LOW" | "MEDIUM" | "HIGH";
  search?: string;
  sortBy?: "createdAt" | "identifier" | "status";
  sortOrder?: "asc" | "desc";
}
