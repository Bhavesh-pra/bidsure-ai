import type { ApiResponse, PaginatedResponse } from "./api";

export type RequirementStatus =
  | "PROPOSED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED";

export type RequirementCategory =
  | "TURNOVER"
  | "NET_WORTH"
  | "GST_REGISTRATION"
  | "PAN_REGISTRATION"
  | "UDYAM_REGISTRATION"
  | "SIMILAR_WORK_EXPERIENCE"
  | "MANPOWER_CAPABILITY"
  | "EQUIPMENT_CAPABILITY"
  | "LITIGATION_HISTORY"
  | "BLACKLIST_DECLARATION"
  | "EARNEST_MONEY_DEPOSIT"
  | "INTEGRITY_PACT"
  | "ISO_CERTIFICATION"
  | "OTHER";

export type RequirementOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "BETWEEN"
  | "CONTAINS"
  | "DOES_NOT_CONTAIN"
  | "ONE_OF"
  | "NONE_OF"
  | "REGEX_MATCH"
  | "DATE_AFTER"
  | "DATE_BEFORE"
  | "DATE_BETWEEN"
  | "VALID_CERTIFICATE"
  | "STATUS_EQUALS"
  | "CUSTOM_SCRIPT";

export interface RequirementSourceProvenance {
  documentId?: string | null;
  documentName?: string | null;
  page?: number | null;
  clauseRef?: string | null;
  text?: string | null;
  location?: Record<string, unknown> | null;
}

export interface RequirementAiMetadata {
  generated: boolean;
  model?: string | null;
  modelVersion?: string | null;
  confidence?: number | null;
}

export interface RequirementRuleMapping {
  id: string;
  ruleId: string;
  ruleVersion: number;
  operator?: RequirementOperator | null;
  expectedValue?: string | null;
  parameters?: Record<string, unknown>;
  enabled?: boolean;
  createdAt?: string;
}

export interface RequirementVersionDTO {
  id: string;
  requirementId: string;
  tenderVersionId: string;
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
  source: RequirementSourceProvenance;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  ai: RequirementAiMetadata;
  createdBy?: string | null;
  createdByName?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  supersedesVersionId?: string | null;
  ruleMapping?: RequirementRuleMapping | null;
  createdAt: string;
}

export interface RequirementDTO {
  id: string;
  organizationId?: string | null;
  tenderId: string;
  tenderVersionId: string;
  identifier: string;
  category: RequirementCategory;
  currentVersionId: string | null;
  currentVersion: RequirementVersionDTO | null;
  versionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCatalogItem {
  id: string;
  name: string;
  category: RequirementCategory;
  description: string;
  defaultVersion: number;
  supportedOperators: RequirementOperator[];
  requiredParameters: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "date";
    description: string;
    required: boolean;
  }>;
  expectedEvidenceType: string;
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

export interface CreateRequirementInput {
  tenderId?: string;
  tenderVersionId?: string;
  identifier: string;
  category?: RequirementCategory;
  title: string;
  description: string;
  mandatory?: boolean;
  condition?: string | null;
  operator?: RequirementOperator | null;
  threshold?: Record<string, unknown> | null;
  expectedValue?: string | null;
  requiredEvidenceType?: string | null;
  sourceClause?: string | null;
  sourcePage?: number | null;
  sourceText?: string | null;
  sourceDocumentId?: string | null;
}

export interface UpdateRequirementInput {
  expectedCurrentVersionId: string;
  title?: string;
  description?: string;
  category?: RequirementCategory;
  mandatory?: boolean;
  condition?: string | null;
  operator?: RequirementOperator | null;
  threshold?: Record<string, unknown> | null;
  expectedValue?: string | null;
  requiredEvidenceType?: string | null;
  sourceClause?: string | null;
  sourcePage?: number | null;
  sourceText?: string | null;
}

export interface ApproveRequirementInput {
  expectedCurrentVersionId: string;
  notes?: string;
}

export interface RejectRequirementInput {
  expectedCurrentVersionId: string;
  rejectionReason: string;
}

export interface MapRuleInput {
  expectedCurrentVersionId: string;
  ruleId: string;
  ruleVersion?: number;
  operator?: RequirementOperator | null;
  expectedValue?: string | null;
  parameters?: Record<string, unknown>;
}

export interface ExtractRequirementsInput {
  documentId?: string;
}

export interface AsyncJobResponse {
  jobId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
}

export type RequirementsResponse = PaginatedResponse<RequirementDTO>;
export type RequirementDetailResponse = ApiResponse<RequirementDTO>;
export type RequirementVersionsResponse = ApiResponse<RequirementVersionDTO[]>;
export type RuleCatalogResponse = ApiResponse<RuleCatalogItem[]>;
