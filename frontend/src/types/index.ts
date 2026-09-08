export interface ApiResponse<T> {
  success: boolean;
  data: T;
  request_id: string;
  error?: {
    code: string;
    message: string;
  };
}

export type RequirementCategory =
  | 'STATUTORY'
  | 'FINANCIAL'
  | 'TECHNICAL'
  | 'REGISTRATION'
  | 'DOCUMENT'
  | 'ELIGIBILITY';

export interface Requirement {
  id: string;
  title: string;
  description?: string;
  category: RequirementCategory;
  mandatory: boolean;
  applicability: string;
  operator?: string;
  expected_value?: string | number | boolean;
  unit?: string;
  evaluation_period?: string;
  source_clause?: string;
  source_page?: number;
  confidence?: number;
}

export interface Tender {
  id: string;
  tender_number: string;
  title: string;
  entity: string;
  category: string;
  submission_deadline: string;
  status: string;
  requirements?: Requirement[];
}

export interface Bidder {
  id: string;
  legal_name: string;
  pan?: string;
  gstin?: string;
  udyam_number?: string;
  organization_type?: string;
}

export interface Bid {
  id: string;
  tender_id: string;
  bidder_id: string;
  bidder_name?: string;
  quoted_amount: number;
  proposed_completion_date?: string;
  status: string;
  submission_time?: string;
}

export interface Evidence {
  id: string;
  document_id: string;
  requirement_id?: string;
  field: string;
  value: string | number | boolean;
  normalized_value?: string | number | boolean;
  page?: number;
  extraction_method: string;
  confidence: number;
}

export type VerificationStatus =
  | 'VERIFIED_PASS'
  | 'VERIFIED_FAIL'
  | 'PARTIAL'
  | 'REVIEW_REQUIRED'
  | 'EVIDENCE_MISSING'
  | 'NOT_APPLICABLE'
  | 'UNABLE_TO_VERIFY'
  | 'CONFLICTING_EVIDENCE';

export interface Verification {
  id: string;
  bid_id: string;
  requirement_id: string;
  verification_type: string;
  source: string;
  status: VerificationStatus;
  match_result: string;
}

export interface Finding {
  id: string;
  bid_id: string;
  requirement_id?: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  title: string;
  description: string;
  requires_review: boolean;
}

export interface Recommendation {
  id: string;
  bid_id: string;
  status: VerificationStatus;
  rationale: string;
  supporting_findings: string[];
  generated_by: string;
}
