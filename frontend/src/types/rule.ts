export type RuleType = 'MANDATORY_DOCUMENT' | 'REGISTRATION' | 'EQUALITY' | 'THRESHOLD' | 'EXPIRY' | 'EXPERIENCE' | 'BOOLEAN';
export type RuleResultStatus = 'PASS' | 'FAIL' | 'REVIEW' | 'UNKNOWN' | 'EVIDENCE_MISSING';

export interface ComplianceRule {
  id: string;
  requirement_id: string;
  rule_type: RuleType;
  operator?: string;
  expected_value?: string | number | boolean;
  parameters: Record<string, unknown>;
  priority: number;
  enabled: boolean;
  version: number;
  created_at?: string;
  updated_at?: string;
}
