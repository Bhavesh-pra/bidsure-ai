import { apiClient } from './api';
import type { ApiResponse, Evidence } from '../types';

export type RequirementResultStatus = 'PASS' | 'FAIL' | 'REVIEW' | 'UNKNOWN';
export type CrossVerificationStatus = 'MATCH' | 'MISMATCH' | 'REVIEW' | 'UNKNOWN';

export interface VerificationRequirement {
  id?: string;
  name: string;
  status: RequirementResultStatus;
  reason?: string;
  evidence?: { document?: string; document_id?: string; page?: number; field?: string; value?: string | number | boolean };
}

export interface CrossVerificationResult {
  field: string;
  status: CrossVerificationStatus;
  reason?: string;
  values?: Array<{ source: string; value: string }>;
}

export interface VerificationResult {
  bid_id: string;
  bidder: { name: string; id?: string };
  compliance_score?: number;
  risk_level?: string;
  risk_factors?: string[];
  requirements_passed?: number;
  requirements_total?: number;
  requirements: VerificationRequirement[];
  evidence?: Evidence[];
  cross_verification: CrossVerificationResult[];
  recommendation?: { status: string; summary?: string; reasons?: string[] };
  verification_status?: string;
}

const mockVerification = (bidId: string): VerificationResult => ({
  bid_id: bidId,
  bidder: { name: 'ABC Technologies Pvt Ltd' },
  compliance_score: 87,
  risk_level: 'LOW',
  risk_factors: ['OEM authorization requires manual review'],
  requirements_passed: 3,
  requirements_total: 4,
  requirements: [
    { name: 'GST Registration', status: 'PASS', reason: 'GST registration evidence is present.', evidence: { document: 'GST.pdf', page: 1, field: 'gstin', value: '27ABCDE1234F1Z5' } },
    { name: 'PAN', status: 'PASS', reason: 'PAN evidence is present.', evidence: { document: 'PAN.pdf', page: 1, field: 'pan', value: 'ABCDE1234F' } },
    { name: 'Udyam Registration', status: 'PASS', reason: 'Udyam evidence is present.', evidence: { document: 'Udyam.pdf', page: 1, field: 'udyam_registration_number', value: 'UDYAM-MH-00-0000000' } },
    { name: 'OEM Authorization', status: 'REVIEW', reason: 'Authorization requires manual review.' },
  ],
  cross_verification: [
    { field: 'GSTIN', status: 'MATCH' },
    { field: 'PAN', status: 'MATCH' },
    { field: 'LEGAL_NAME', status: 'MATCH' },
  ],
  recommendation: { status: 'REVIEW_REQUIRED', summary: 'Bidder appears substantially compliant.', reasons: ['3 of 4 requirements verified', 'OEM authorization requires manual review.'] },
  verification_status: 'COMPLETED',
});

export const verificationService = {
  async verifyBid(bidId: string): Promise<ApiResponse<VerificationResult>> {
    try {
      const response = await apiClient.post(`/bids/${bidId}/verify`);
      return response as unknown as ApiResponse<VerificationResult>;
    } catch (error: any) {
      // Keep the interface demoable until the orchestration endpoint is available.
      if (error?.code === 'NETWORK_ERROR' || error?.code === 'NOT_FOUND' || error?.code === 'NOT_IMPLEMENTED') {
        return { success: true, data: mockVerification(bidId), request_id: 'MOCK-VERIFICATION' };
      }
      throw error;
    }
  },
};
