export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Verification {
  id: string;
  evidenceId: string;
  status: VerificationStatus;
  checkedBy?: string;
  checkedAt?: string;
  notes?: string;
}
