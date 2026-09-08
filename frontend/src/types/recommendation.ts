export interface Recommendation {
  id: string;
  text: string;
  rationale?: string;
  relatedRequirementIds?: string[];
  priority?: number;
}
