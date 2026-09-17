export type DocumentType =
  | 'GST_CERTIFICATE'
  | 'PAN_CARD'
  | 'UDYAM_CERTIFICATE'
  | 'OEM_AUTHORIZATION'
  | 'FINANCIAL_STATEMENT'
  | 'TURNOVER_CERTIFICATE'
  | 'TECHNICAL_SPECIFICATION'
  | 'MAKE_IN_INDIA_DECLARATION'
  | 'EXPERIENCE_CERTIFICATE'
  | 'OTHER';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  GST_CERTIFICATE: 'GST Certificate',
  PAN_CARD: 'PAN Card',
  UDYAM_CERTIFICATE: 'Udyam Certificate',
  OEM_AUTHORIZATION: 'OEM Authorization',
  FINANCIAL_STATEMENT: 'Financial Statement',
  TURNOVER_CERTIFICATE: 'Turnover Certificate',
  TECHNICAL_SPECIFICATION: 'Technical Specification',
  MAKE_IN_INDIA_DECLARATION: 'Make in India Declaration',
  EXPERIENCE_CERTIFICATE: 'Experience Certificate',
  OTHER: 'Other Document',
};

export const EXPECTED_BID_DOCUMENTS: DocumentType[] = [
  'GST_CERTIFICATE',
  'PAN_CARD',
  'UDYAM_CERTIFICATE',
  'OEM_AUTHORIZATION',
  'FINANCIAL_STATEMENT',
  'TECHNICAL_SPECIFICATION',
];

export interface Document {
  id: string;
  bid_id?: string;
  tender_id?: string;
  document_type: DocumentType | string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  page_count?: number | null;
  description?: string | null;
  processing_status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'INVALID' | string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy optional properties for backward compatibility
  name?: string;
  document_id?: string;
  url?: string;
  storage_key?: string;
  uploadedAt?: string;
  processing_error?: string | null;
  ocr_engine?: string | null;
  pages?: OCRPage[];
  classified_document_type?: string | null;
  classification_confidence?: number | null;
  classification_status?: 'CLASSIFIED' | 'UNKNOWN' | 'PROCESSING' | 'FAILED' | 'REVIEW_REQUIRED' | string | null;
  classification_method?: string | null;
  classified_at?: string | null;
  classification_error?: string | null;
}

export interface OCRPage {
  page_number: number;
  text: string;
  ocr_confidence?: number | null;
}
