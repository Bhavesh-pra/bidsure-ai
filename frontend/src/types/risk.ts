export type RiskLevel = 'low' | 'medium' | 'high';

export interface Risk {
  id: string;
  description?: string;
  level: RiskLevel;
  likelihood?: number; // 0-1
  impact?: number; // 0-1
}
