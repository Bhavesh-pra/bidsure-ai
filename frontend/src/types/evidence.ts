export interface Evidence {
  id: string;
  evidence_id?: string;
  bid_id?: string;
  document_id: string;
  requirement_id?: string;
  field: string;
  value: string | number | boolean;
  normalized_value?: string | number | boolean;
  page?: number;
  source_type?: string;
  extraction_method?: string;
  confidence: number;
  confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  status?: string;
  captured_at?: string;
}
