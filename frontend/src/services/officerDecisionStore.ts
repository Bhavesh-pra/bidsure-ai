export type OfficerDecisionAction = 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION';

export interface OfficerDecision {
  bid_id: string;
  action: OfficerDecisionAction;
  note?: string;
  actor: string;
  recorded_at: string;
}

const keyFor = (bidId: string) => `bidsure:officer-decision:${bidId}`;

export const officerDecisionStore = {
  get(bidId: string): OfficerDecision | null {
    try { const raw = localStorage.getItem(keyFor(bidId)); return raw ? JSON.parse(raw) as OfficerDecision : null; } catch { return null; }
  },
  save(decision: OfficerDecision): OfficerDecision {
    localStorage.setItem(keyFor(decision.bid_id), JSON.stringify(decision));
    return decision;
  },
};
