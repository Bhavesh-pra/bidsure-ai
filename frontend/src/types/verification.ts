export type VerificationStatus = 
  | 'VERIFIED' 
  | 'VERIFIED_FAIL' 
  | 'REVIEW_REQUIRED' 
  | 'UNABLE_TO_VERIFY' 
  | 'CONFLICTING_EVIDENCE';

export interface VerificationResult {
  requirement_id: string;
  verification_type: string;
  source: string;
  status: VerificationStatus;
  match_result: boolean;
  details?: Record<string, any>;
}
