export interface Document {
  id: string;
  document_id?: string;
  tender_id?: string;
  name: string;
  original_filename?: string;
  url?: string;
  mimeType?: string;
  mime_type?: string;
  size_bytes?: number;
  sha256?: string;
  storage_key?: string;
  page_count?: number;
  processing_status?: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | string;
  uploadedAt?: string;
  created_at?: string;
}
