export type ExtractionMethod = 'OCR_LLM' | 'DIRECT_PARSE' | 'MANUAL' | 'MOCK';

export interface Evidence {
  document_id: string;
  field: string;
  value: any;
  normalized_value?: any;
  page?: number;
  confidence: number;
  extraction_method: ExtractionMethod;
}
