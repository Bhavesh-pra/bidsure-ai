import { apiClient } from './api';

export type OfficerDecisionAction = 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION';

export interface OfficerDecision {
  id?: string;
  bid_id: string;
  action: OfficerDecisionAction;
  decision?: string;
  note?: string;
  remarks?: string;
  actor: string;
  recorded_at: string;
  compliance_score_at_decision?: number;
  risk_level_at_decision?: string;
  recommendation_at_decision?: string;
}

export interface AuditEventItem {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  bid_id?: string;
  user_name?: string;
  timestamp: string;
  remarks?: string;
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  metadata?: Record<string, any>;
}

const keyFor = (bidId: string) => `bidsure:officer-decision:${bidId}`;

export const officerDecisionStore = {
  get(bidId: string): OfficerDecision | null {
    try {
      const raw = localStorage.getItem(keyFor(bidId));
      return raw ? (JSON.parse(raw) as OfficerDecision) : null;
    } catch {
      return null;
    }
  },

  save(decision: OfficerDecision): OfficerDecision {
    try {
      localStorage.setItem(keyFor(decision.bid_id), JSON.stringify(decision));
    } catch {
      // ignore localStorage quota errors
    }
    return decision;
  },

  async fetchDecision(bidId: string): Promise<OfficerDecision | null> {
    try {
      const response: any = await apiClient.get(`/bids/${bidId}/decision`);
      const raw = response?.data?.decision || response?.decision;
      if (raw) {
        const decision: OfficerDecision = {
          id: raw.id,
          bid_id: raw.bid_id || bidId,
          action: (raw.action || (raw.decision === 'QUALIFIED' ? 'APPROVE' : raw.decision === 'DISQUALIFIED' ? 'REJECT' : 'REQUEST_CLARIFICATION')) as OfficerDecisionAction,
          decision: raw.decision,
          note: raw.remarks,
          remarks: raw.remarks,
          actor: raw.officer_name || 'Procurement Officer',
          recorded_at: raw.created_at || new Date().toISOString(),
          compliance_score_at_decision: raw.compliance_score_at_decision,
          risk_level_at_decision: raw.risk_level_at_decision,
          recommendation_at_decision: raw.recommendation_at_decision,
        };
        officerDecisionStore.save(decision);
        return decision;
      }
    } catch {
      // fallback to cached store
    }
    return officerDecisionStore.get(bidId);
  },

  async submitDecision(bidId: string, action: OfficerDecisionAction, note?: string): Promise<OfficerDecision> {
    const fallbackDecision: OfficerDecision = {
      bid_id: bidId,
      action,
      note,
      remarks: note,
      actor: 'Procurement Officer',
      recorded_at: new Date().toISOString(),
    };

    try {
      const response: any = await apiClient.post(`/bids/${bidId}/decision`, {
        decision: action,
        remarks: note || '',
      });
      const raw = response?.data?.decision || response?.decision;
      if (raw) {
        const saved: OfficerDecision = {
          id: raw.id,
          bid_id: raw.bid_id || bidId,
          action: (raw.action || action) as OfficerDecisionAction,
          decision: raw.decision,
          note: raw.remarks || note,
          remarks: raw.remarks || note,
          actor: raw.officer_name || 'Procurement Officer',
          recorded_at: raw.created_at || new Date().toISOString(),
          compliance_score_at_decision: raw.compliance_score_at_decision,
          risk_level_at_decision: raw.risk_level_at_decision,
          recommendation_at_decision: raw.recommendation_at_decision,
        };
        officerDecisionStore.save(saved);
        return saved;
      }
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR') {
        officerDecisionStore.save(fallbackDecision);
        return fallbackDecision;
      }
      throw err;
    }
    officerDecisionStore.save(fallbackDecision);
    return fallbackDecision;
  },

  async fetchAudit(bidId: string): Promise<AuditEventItem[]> {
    try {
      const response: any = await apiClient.get(`/bids/${bidId}/audit`);
      const events = response?.data?.audit_events || response?.audit_events;
      if (Array.isArray(events)) {
        return events.map((ev: any) => ({
          id: ev.id,
          action: ev.action,
          entity_type: ev.entity_type,
          entity_id: ev.entity_id,
          bid_id: ev.bid_id,
          user_name: ev.user_name || 'System / Officer',
          timestamp: ev.timestamp,
          remarks: ev.metadata?.remarks,
          metadata: ev.metadata,
          previous_state: ev.previous_state,
          new_state: ev.new_state,
        }));
      }
    } catch {
      // ignore
    }
    return [];
  },
};
