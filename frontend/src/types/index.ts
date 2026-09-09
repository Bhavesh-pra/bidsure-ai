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
  | 'ELIGIBILITY'
  | 'OPERATIONAL';

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

export type {
  CreateTenderPayload,
  Tender,
  TenderCategory,
  TenderStatus,
  TenderType,
} from './tender';
export {
  TENDER_CATEGORIES,
  TENDER_STATUSES,
  TENDER_TYPES,
} from './tender';
export type { ComplianceRule, RuleResultStatus, RuleType } from './rule';

export interface Bidder {
  id: string;
  legal_name: string;
  pan?: string;
  gstin?: string;
  udyam_number?: string;
  organization_type?: string;
  address?: string;
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
  created_at?: string;
  updated_at?: string;
  bidder?: Bidder;
  tender?: { id: string; tender_number?: string; title?: string };
}

export type { Document, DocumentType } from './document';
export { DOCUMENT_TYPE_LABELS, EXPECTED_BID_DOCUMENTS } from './document';

export interface Evidence {
  id: string;
  document_id: string;
  requirement_id?: string;
  field: string;
  value: string | number | boolean;
  normalized_value?: string | number | boolean;
  page?: number;
  extraction_method: 'OCR_LLM' | 'OCR_TESSERACT' | 'REGEX' | 'MANUAL_ENTRY' | 'BARCODE_QR' | string;
  confidence: number;
}

export type VerificationStatus =
  | 'VERIFIED'
  | 'VERIFIED_PASS'
  | 'VERIFIED_FAIL'
  | 'REVIEW_REQUIRED'
  | 'UNABLE_TO_VERIFY'
  | 'CONFLICTING_EVIDENCE'
  | 'EVIDENCE_MISSING'
  | 'NOT_APPLICABLE';

export interface Verification {
  id: string;
  bid_id?: string;
  requirement_id: string;
  evidence_id?: string;
  verification_type: string;
  source: string;
  status: VerificationStatus;
  match_result: boolean | string;
  source_reference?: string;
  response_snapshot?: Record<string, unknown>;
}

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
  score?: number;
  finding?: string | null;
  reason?: string;
  supporting_evidence_ids?: string[];
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
  type: string;
  severity: RiskLevel;
  description?: string;
  requirement_id?: string;
}

export interface RiskAssessment {
  id: string;
  bid_id?: string;
  risk_score: number;
  risk_level: RiskLevel;
  factors: RiskFactor[];
  explanation?: string;
  methodology_version?: string;
}

export interface Finding {
  id: string;
  bid_id: string;
  requirement_id?: string;
  category: string;
  severity: RiskLevel;
  status: string;
  title: string;
  description: string;
  requires_review: boolean;
}

export type RecommendationStatus = 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED' | 'PASS' | 'FAIL';

export interface Recommendation {
  id: string;
  bid_id?: string;
  status: RecommendationStatus;
  rationale: string;
  supporting_findings: string[];
  officer_authority_disclaimer: string;
  generated_by: string;
}
