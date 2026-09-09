import type { Bidder } from './bidder';
import type { Document } from './document';

export interface Bid {
  id: string;
  tenderId: string;
  bidderId: string;
  amount?: number;
  quoted_amount?: number;
  currency?: string;
  submittedAt?: string;
  bidder?: Bidder;
  status?: string;
  proposed_completion_date?: string;
  documents?: Document[];
}
