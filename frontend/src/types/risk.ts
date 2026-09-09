export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
  type: string;
  severity: RiskLevel;
  description?: string;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: RiskLevel;
  factors: RiskFactor[];
}
