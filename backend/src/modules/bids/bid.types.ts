import type { BidStatus } from "@prisma/client";
export type { TenantContext } from "../../shared/auth/tenant-context.js";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface BidFilterParams extends PaginationParams {
  tenderId?: string | undefined;
  status?: BidStatus | undefined;
}

export interface CreateBidInput {
  tenderId: string;
  tenderVersionId: string;
  bidderId?: string | undefined;
  totalAmount?: number | null | undefined;
  currency?: string | undefined;
  metadata?: Record<string, unknown> | null | undefined;
}

export interface UpdateDraftBidInput {
  totalAmount?: number | null | undefined;
  currency?: string | undefined;
  metadata?: Record<string, unknown> | null | undefined;
  expectedVersion?: number | undefined;
}

export interface BidDTO {
  id: string;
  organizationId: string;
  tenderId: string;
  tenderVersionId: string;
  bidderId: string;
  bidReference: string;
  status: BidStatus | string;
  version: number;
  totalAmount: number | null;
  currency: string;
  metadata?: Record<string, unknown> | null | undefined;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bidder?: {
    id: string;
    legalName: string;
    tradeName: string | null;
    contactEmail: string;
    contactPhone?: string | null | undefined;
  } | undefined;
  tender?: {
    id: string;
    title: string;
    referenceNumber: string;
    status?: string | undefined;
  } | undefined;
  tenderVersion?: {
    id: string;
    versionNumber: number;
    title: string;
    status?: string | undefined;
  } | undefined;
  documents?: Array<{
    id: string;
    category: string;
    required: boolean;
    document: {
      id: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      processingStatus: string;
      createdAt: string;
    };
  }> | undefined;
}
