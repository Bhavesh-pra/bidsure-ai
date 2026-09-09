import React from 'react';
import { useParams } from 'react_router_dom_shim';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';

export const DecisionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <AppLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>Procurement Officer Decision: {id || 'BID-001'}</h1>
        <p style={{ color: '#718096', margin: '0.25rem 0 0 0' }}>AI Evaluation vs Human Decision Authority</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2b6cb0' }}>🤖 AI Evaluation Output</h3>
          <p><strong>Recommendation:</strong> <StatusBadge status="REVIEW_REQUIRED" /></p>
          <p><strong>Rationale:</strong> OEM authorization requires manual review.</p>
          <p><strong>Supporting Findings:</strong> <code>FIND-001</code></p>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>👤 Procurement Officer Authority</h3>
          <p style={{ fontSize: '0.85rem', color: '#718096' }}>The Procurement Officer retains final decision authority.</p>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Officer Decision Note</label>
            <textarea
              rows={4}
              placeholder="Enter official rationale for decision override or approval..."
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button style={{ padding: '0.5rem 1rem', backgroundColor: '#38a169', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Approve Bid
            </button>
            <button style={{ padding: '0.5rem 1rem', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Reject Bid
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DecisionPage;
