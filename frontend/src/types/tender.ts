import { Requirement } from './requirement';

export type TenderStatus = 'DRAFT' | 'PUBLISHED' | 'EVALUATION' | 'AWARDED' | 'CLOSED';

export interface TenderVersion {
  id: string;
  version_number: number;
  published_at?: string;
  requirements?: Requirement[];
}

export interface Tender {
  id: string;
  title: string;
  organization_id: string;
  category: string;
  estimated_value: number;
  currency?: string;
  closing_date?: string;
  status: TenderStatus;
  versions_count?: number;
  bids_count?: number;
  current_version?: TenderVersion;
}
