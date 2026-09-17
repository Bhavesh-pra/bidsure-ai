import type { ApiResponse, PaginatedResponse } from "./api";

export type TenderStatus = "DRAFT" | "PUBLISHED" | "EVALUATION" | "AWARDED" | "CANCELLED";

export interface RequirementVersionDTO {
  versionNumber: number;
  description: string;
  mandatory: boolean;
}

export interface RequirementDTO {
  id: string;
  identifier: string;
  category: string;
  createdAt: string;
  currentVersion?: RequirementVersionDTO;
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
  requirements?: RequirementDTO[];
}

export interface TenderDTO {
  id: string;
  organizationId: string;
  title: string;
  referenceNumber: string;
  status: TenderStatus | string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  currentVersion?: TenderVersionDTO | null;
  versionsCount?: number;
}

export interface CreateTenderInput {
  title: string;
  referenceNumber: string;
  description?: string;
  organizationId?: string;
}

export type TendersResponse = PaginatedResponse<TenderDTO>;
export type TenderDetailResponse = ApiResponse<TenderDTO>;
