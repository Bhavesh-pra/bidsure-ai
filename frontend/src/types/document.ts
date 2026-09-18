export type DocumentStatus =
  | "UPLOADING"
  | "SCANNING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "QUARANTINED"
  | "REPLACEMENT_REQUIRED";

export interface DocumentDTO {
  id: string;
  organizationId: string;
  fileName: string;
  originalFilename: string;
  mediaType: string;
  extension: string;
  sizeBytes: number;
  sha256: string;
  status: DocumentStatus;
  scanStatus: string | null;
  scanTimestamp: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  supersedesDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BidDocumentDTO {
  id: string;
  bidId: string;
  documentId: string;
  documentType: string;
  document: DocumentDTO;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUploadProgress {
  file: File;
  documentType: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export interface BidDocumentsResponse {
  success: boolean;
  data: BidDocumentDTO[];
  meta?: {
    total: number;
  };
}

export interface BidDocumentDetailResponse {
  success: boolean;
  data: BidDocumentDTO;
  message?: string;
}

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}
