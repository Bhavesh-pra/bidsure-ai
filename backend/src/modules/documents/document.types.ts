import type { DocumentStatus, DocumentProcessingStatus } from "@prisma/client";

export type DocumentLifecycleStatus =
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
  mimeType: string;
  mediaType: string;
  extension: string;
  fileSize: number;
  sizeBytes: number;
  sha256: string;
  storageKey: string;
  status: DocumentLifecycleStatus | DocumentStatus;
  processingStatus: DocumentProcessingStatus;
  uploadedById?: string | null;
  scanStatus?: string | null;
  scanTimestamp?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  supersedesDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BidDocumentDTO {
  id: string;
  bidId: string;
  documentId: string;
  category: string;
  required: boolean;
  createdAt: string;
  updatedAt: string;
  document: DocumentDTO;
}

export interface UploadDocumentInput {
  bidId: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  category?: string | undefined;
  idempotencyKey?: string | undefined;
  supersedesDocumentId?: string | undefined;
}
