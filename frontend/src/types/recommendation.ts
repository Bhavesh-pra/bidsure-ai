export type RecommendationStatus = 'ACCEPT' | 'REJECT' | 'REVIEW_REQUIRED';

export interface Recommendation {
  status: RecommendationStatus;
  rationale: string;
  supporting_findings: string[];
  officer_override_note?: string;
}
