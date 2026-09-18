import type { ApiResponse, PaginatedResponse } from "./api";
import type { RequirementDTO, RequirementVersionDTO } from "./requirement";

export type { RequirementDTO, RequirementVersionDTO };

export type TenderStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | string;

export interface TenderVersionContentPayload {
  submissionDeadline?: string;
  budget?: number;
  currency?: string;
  tenderType?: string;
  scopeSummary?: string;
  metadata?: Record<string, unknown>;
}

export interface TenderVersionDTO {
  id: string;
  tenderId: string;
  versionNumber: number;
  title: string;
  description: string | null;
  content: unknown;
  changeSummary?: string | null;
  status: string;
  createdAt: string;
  isCurrent?: boolean;
  requirements?: RequirementDTO[];
}

export interface TenderDTO {
  id: string;
  organizationId: string;
  title: string;
  referenceNumber: string;
  category?: string | null;
  department?: string | null;
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
  category?: string;
  department?: string;
  submissionDeadline?: string;
  budget?: number;
  content?: TenderVersionContentPayload;
  organizationId?: string;
}

export interface UpdateTenderMetadataInput {
  title?: string;
  category?: string;
  department?: string;
  expectedVersion?: number;
}

export interface CreateTenderVersionInput {
  title?: string;
  description?: string;
  changeSummary?: string;
  submissionDeadline?: string;
  budget?: number;
  content?: TenderVersionContentPayload;
  status?: "DRAFT" | "PUBLISHED";
  expectedCurrentVersionId?: string;
}

export type TendersResponse = PaginatedResponse<TenderDTO>;
export type TenderDetailResponse = ApiResponse<TenderDTO>;
export type TenderVersionsResponse = ApiResponse<TenderVersionDTO[]>;
export type TenderVersionResponse = ApiResponse<TenderVersionDTO>;
export type CreateVersionResponse = ApiResponse<{ tender: TenderDTO; version: TenderVersionDTO }>;
