export type RequirementCategory = 'STATUTORY' | 'FINANCIAL' | 'TECHNICAL' | 'EXPERIENCE' | 'LEGAL';

export type RequirementOperator = 
  | 'EQUALS' 
  | 'NOT_EQUALS' 
  | 'GREATER_THAN_EQUAL' 
  | 'LESS_THAN_EQUAL' 
  | 'GREATER_THAN' 
  | 'LESS_THAN' 
  | 'CONTAINS' 
  | 'IN_LIST';

export interface Requirement {
  id: string;
  title: string;
  description?: string;
  category: RequirementCategory;
  mandatory: boolean;
  applicability?: string;
  operator: RequirementOperator;
  expected_value: any;
  unit?: string;
  evaluation_period?: string;
  source_clause?: string;
  source_page?: number;
  confidence?: number;
}
