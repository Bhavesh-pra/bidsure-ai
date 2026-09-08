import type { Bidder } from './bidder';
import type { Document } from './document';

export interface Bid {
  id: string;
  tenderId: string;
  bidderId: string;
  amount?: number;
  currency?: string;
  submittedAt?: string;
  bidder?: Bidder;
  documents?: Document[];
}
