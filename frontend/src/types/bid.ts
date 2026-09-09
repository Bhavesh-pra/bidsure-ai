export interface Bid {
  id: string;
  tender_id: string;
  bidder_id: string;
  bidder_name?: string;
  status: string;
  submitted_at?: string;
  documents_count?: number;
}
