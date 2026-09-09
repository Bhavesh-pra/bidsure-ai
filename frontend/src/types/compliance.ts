export type ComplianceStatus = 
  | 'PASS' 
  | 'FAIL' 
  | 'REVIEW_REQUIRED' 
  | 'NOT_APPLICABLE' 
  | 'EVIDENCE_MISSING' 
  | 'UNABLE_TO_VERIFY';

export interface ComplianceResult {
  requirement_id: string;
  status: ComplianceStatus;
  score: number;
  finding?: string | null;
}
