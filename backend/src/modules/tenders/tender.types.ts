export interface TenantContext {
  organizationId: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CreateTenderInput {
  title: string;
  referenceNumber: string;
  description?: string | undefined;
  organizationId?: string | undefined;
}

export interface TenderDTO {
  id: string;
  organizationId: string;
  title: string;
  referenceNumber: string;
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
  status: string;
  createdAt: string;
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

