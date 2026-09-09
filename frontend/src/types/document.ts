export type DocumentCategory = 
  | 'GST_CERTIFICATE'
  | 'PAN_CARD'
  | 'UDYAM_CERTIFICATE'
  | 'TURNOVER_CERTIFICATE'
  | 'OEM_AUTHORIZATION'
  | 'LOCAL_CONTENT_DECLARATION'
  | 'TECHNICAL_SPECIFICATION'
  | 'OTHER';

export interface Document {
  id: string;
  bid_id: string;
  filename: string;
  category: DocumentCategory;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_at?: string;
}
