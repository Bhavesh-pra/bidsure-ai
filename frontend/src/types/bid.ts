import type { ApiResponse, PaginatedResponse } from "./api";

export type BidStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PROCESSING"
  | "UNDER_REVIEW"
  | "CLARIFICATION_REQUIRED"
  | "READY_FOR_DECISION"
  | "DECIDED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "ARCHIVED";

export interface BidderInfoDTO {
  id: string;
  legalName: string;
  tradeName: string | null;
  contactEmail: string;
}

export interface BidTenderInfoDTO {
  id: string;
  title: string;
  referenceNumber: string;
}

export interface BidTenderVersionInfoDTO {
  id: string;
  versionNumber: number;
  title: string;
}

export interface BidDocumentItemDTO {
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
  metadata?: Record<string, unknown> | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bidder?: BidderInfoDTO;
  tender?: BidTenderInfoDTO;
  tenderVersion?: BidTenderVersionInfoDTO;
  documents?: BidDocumentItemDTO[];
}

export interface CreateBidPayload {
  tenderId: string;
  tenderVersionId: string;
  totalAmount?: number | null;
  currency?: string;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateDraftBidPayload {
  totalAmount?: number | null;
  currency?: string;
  metadata?: Record<string, unknown> | null;
  expectedVersion?: number;
}

export type BidsResponse = PaginatedResponse<BidDTO>;
export type BidDetailResponse = ApiResponse<BidDTO>;
