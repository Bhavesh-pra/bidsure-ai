import type { Bidder } from './bidder';
import type { Document } from './document';

export interface Bid {
  id: string;
  tenderId?: string;
  tender_id?: string;
  bidderId?: string;
  bidder_id?: string;
  amount?: number;
  quoted_amount?: number;
  currency?: string;
  submittedAt?: string;
  bidder?: Bidder;
  tender?: { id: string; title: string };
  status?: string;
  compliance_score?: number;
  risk_level?: string;
  proposed_completion_date?: string;
  documents?: Document[];
}
