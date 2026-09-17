export interface TenantContext {
  organizationId: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface BidDTO {
  id: string;
  organizationId: string;
  tenderId: string;
  tenderVersionId: string;
  bidderId: string;
  bidReference: string;
  status: string;
  totalAmount: number | null;
  currency: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bidder?: {
    id: string;
    legalName: string;
    tradeName: string | null;
    contactEmail: string;
  } | undefined;
  tender?: {
    id: string;
    title: string;
    referenceNumber: string;
  } | undefined;
  tenderVersion?: {
    id: string;
    versionNumber: number;
    title: string;
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

