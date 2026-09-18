export interface NormalizedBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedEvidenceItemDTO {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  field: string;
  value: string;
  normalizedValue: string | null;
  page: number;
  boundingBox: NormalizedBoundingBox | null;
  confidence: number;
  method: string;
  extractionStatus: "EXTRACTED" | "REVIEW_RECOMMENDED";
  pipelineVersion: string;
  createdAt: string;
}

export interface BidEvidenceResponse {
  success: boolean;
  data: {
    bidId: string;
    totalEvidence: number;
    documentsCount: number;
    evidence: ExtractedEvidenceItemDTO[];
  };
  meta?: {
    total: number;
    documentsCount?: number;
    requestId?: string;
  };
  requestId: string;
}

export interface DocumentIntelligenceDTO {
  document: {
    id: string;
    fileName: string;
    originalFilename: string | null;
    status: string;
    documentType: string | null;
    classificationConfidence: number | null;
    mimeType: string;
    fileSize: number;
    sha256: string;
  };
  ocr: {
    id: string;
    status: string;
    text: string | null;
    pageCount: number;
    pages: Array<{
      page: number;
      text: string;
      confidence: number;
      boundingBoxes?: Array<{ text: string; box: NormalizedBoundingBox }>;
    }> | null;
    engine: string;
    engineVersion: string | null;
    extractionMethod: string;
    confidence: number | null;
    startedAt: string | null;
    completedAt: string | null;
    runNumber: number;
  } | null;
  classification: {
    id: string;
    documentType: string;
    confidence: number;
    method: string;
    runNumber: number;
    pipelineVersion: string;
    classifierVersion: string;
  } | null;
  evidence: Array<{
    id: string;
    field: string;
    value: string;
    normalizedValue: string | null;
    page: number;
    boundingBox: NormalizedBoundingBox | null;
    confidence: number;
    method: string;
    extractionStatus: "EXTRACTED" | "REVIEW_RECOMMENDED";
    pipelineVersion: string;
    createdAt: string;
  }>;
}

export interface DocumentIntelligenceResponse {
  success: boolean;
  data: DocumentIntelligenceDTO;
  requestId: string;
}

export interface ProcessDocumentResponse {
  success: boolean;
  data: {
    documentId: string;
    status: string;
    jobId: string;
  };
  requestId: string;
}
