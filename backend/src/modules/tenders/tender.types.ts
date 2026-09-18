export type { TenantContext } from "../../shared/auth/tenant-context.js";

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string | undefined;
  status?: string | undefined;
  category?: string | undefined;
  department?: string | undefined;
  sortBy?: "createdAt" | "updatedAt" | "referenceNumber" | "title" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

export interface TenderVersionContentPayload {
  submissionDeadline?: string | undefined;
  budget?: number | undefined;
  currency?: string | undefined;
  tenderType?: string | undefined;
  scopeSummary?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface CreateTenderInput {
  title: string;
  referenceNumber: string;
  description?: string | undefined;
  category?: string | undefined;
  department?: string | undefined;
  submissionDeadline?: string | undefined;
  budget?: number | undefined;
  content?: TenderVersionContentPayload | undefined;
  organizationId?: string | undefined;
}

export interface UpdateTenderInput {
  title?: string | undefined;
  category?: string | undefined;
  department?: string | undefined;
  expectedVersion?: number | undefined;
}

export interface CreateTenderVersionInput {
  title?: string | undefined;
  description?: string | undefined;
  changeSummary?: string | undefined;
  submissionDeadline?: string | undefined;
  budget?: number | undefined;
  content?: TenderVersionContentPayload | undefined;
  status?: "DRAFT" | "PUBLISHED" | undefined;
  expectedCurrentVersionId?: string | undefined;
}

export interface TenderDTO {
  id: string;
  organizationId: string;
  title: string;
  referenceNumber: string;
  category: string | null;
  department: string | null;
  status: string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  currentVersion?: TenderVersionDTO | null | undefined;
  versionsCount?: number | undefined;
}

export interface TenderVersionDTO {
  id: string;
  tenderId: string;
  versionNumber: number;
  title: string;
  description: string | null;
  content: unknown;
  changeSummary: string | null;
  status: string;
  createdAt: string;
  isCurrent?: boolean | undefined;
  requirements?: RequirementDTO[] | undefined;
}

export interface RequirementDTO {
  id: string;
  identifier: string;
  category: string;
  createdAt: string;
  currentVersion?: {
    versionNumber: number;
    description: string;
    mandatory: boolean;
  } | undefined;
}
