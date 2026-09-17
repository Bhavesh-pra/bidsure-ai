import type { Requirement } from './requirement';

export const TENDER_CATEGORIES = [
  'STATUTORY',
  'FINANCIAL',
  'TECHNICAL',
  'REGISTRATION',
  'DOCUMENT',
  'ELIGIBILITY',
] as const;

export type TenderCategory = (typeof TENDER_CATEGORIES)[number];

export const TENDER_TYPES = ['OPEN', 'LIMITED', 'SINGLE_SOURCE'] as const;
export type TenderType = (typeof TENDER_TYPES)[number];

export const TENDER_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED'] as const;
export type TenderStatus = (typeof TENDER_STATUSES)[number];

export interface Tender {
  id: string;
  tender_number: string;
  title: string;
  description?: string;
  organization?: string;
  entity?: string;
  category: TenderCategory;
  tender_type: TenderType;
  submission_deadline: string;
  status: TenderStatus;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  requirements?: Requirement[];
}

export type CreateTenderPayload = Pick<
  Tender,
  'tender_number' | 'title' | 'description' | 'category' | 'tender_type' | 'submission_deadline'
>;
