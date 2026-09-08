export type StatusKey =
  | 'PASS'
  | 'FAIL'
  | 'REVIEW'
  | 'PENDING'
  | 'PROCESSING'
  | 'VERIFIED'
  | 'VERIFIED_PASS'
  | 'VERIFIED_FAIL'
  | 'UNABLE_TO_VERIFY'
  | 'NOT_APPLICABLE'
  | 'CONFLICTING_EVIDENCE'
  | 'PARTIAL'
  | 'QUALIFIED'
  | 'DISQUALIFIED';

export const STATUS = {
  PASS: 'PASS' as StatusKey,
  FAIL: 'FAIL' as StatusKey,
  REVIEW: 'REVIEW' as StatusKey,
  PENDING: 'PENDING' as StatusKey,
  PROCESSING: 'PROCESSING' as StatusKey,
  VERIFIED: 'VERIFIED' as StatusKey,
  VERIFIED_PASS: 'VERIFIED_PASS' as StatusKey,
  VERIFIED_FAIL: 'VERIFIED_FAIL' as StatusKey,
  UNABLE_TO_VERIFY: 'UNABLE_TO_VERIFY' as StatusKey,
  NOT_APPLICABLE: 'NOT_APPLICABLE' as StatusKey,
  CONFLICTING_EVIDENCE: 'CONFLICTING_EVIDENCE' as StatusKey,
  PARTIAL: 'PARTIAL' as StatusKey,
  QUALIFIED: 'QUALIFIED' as StatusKey,
  DISQUALIFIED: 'DISQUALIFIED' as StatusKey,
} as const;

export const STATUS_LIST: StatusKey[] = Object.values(STATUS) as StatusKey[];

export default STATUS;
