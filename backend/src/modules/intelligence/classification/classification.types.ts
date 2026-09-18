export const PIPELINE_VERSION = "phase09-v1";
export const CLASSIFIER_VERSION = "phase09-classifier-v1";
export const EXTRACTOR_VERSION = "phase09-extractor-v1";

export type DocumentClassificationType =
  | "GST_CERTIFICATE"
  | "PAN_DOCUMENT"
  | "UDYAM_CERTIFICATE"
  | "INCORPORATION_CERTIFICATE"
  | "TURNOVER_CERTIFICATE"
  | "OEM_AUTHORIZATION"
  | "FINANCIAL_STATEMENT"
  | "DECLARATION"
  | "TECHNICAL_SPECIFICATION"
  | "OTHER"
  | "UNKNOWN";

export interface ClassificationResult {
  documentType: DocumentClassificationType;
  confidence: number;
  method: string;
  runNumber: number;
  pipelineVersion: string;
  classifierVersion: string;
  metadata?: Record<string, unknown>;
}
