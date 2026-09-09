import React from 'react';
import { useParams } from 'react_router_dom_shim';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';

export const AuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <AppLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>Audit Trail & Compliance Log: {id || 'BID-001'}</h1>
        <p style={{ color: '#718096', margin: '0.25rem 0 0 0' }}>Immutable Record of Extraction, Verification, and Decision Events</p>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #edf2f7', color: '#718096', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.75rem' }}>TIMESTAMP</th>
              <th style={{ padding: '0.75rem' }}>EVENT</th>
              <th style={{ padding: '0.75rem' }}>ACTOR</th>
              <th style={{ padding: '0.75rem' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #edf2f7', fontSize: '0.9rem' }}>
              <td style={{ padding: '0.75rem', color: '#718096' }}>2026-09-08 10:00:00</td>
              <td style={{ padding: '0.75rem', fontWeight: 600 }}>Tender Requirements Loaded</td>
              <td style={{ padding: '0.75rem' }}>SYSTEM</td>
              <td style={{ padding: '0.75rem' }}><StatusBadge status="VERIFIED" /></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #edf2f7', fontSize: '0.9rem' }}>
              <td style={{ padding: '0.75rem', color: '#718096' }}>2026-09-08 10:05:12</td>
              <td style={{ padding: '0.75rem', fontWeight: 600 }}>Bid Submitted by ABC Technologies</td>
              <td style={{ padding: '0.75rem' }}>BIDDER</td>
              <td style={{ padding: '0.75rem' }}><StatusBadge status="PASS" /></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #edf2f7', fontSize: '0.9rem' }}>
              <td style={{ padding: '0.75rem', color: '#718096' }}>2026-09-08 10:10:45</td>
              <td style={{ padding: '0.75rem', fontWeight: 600 }}>GST Verification Check Executed</td>
              <td style={{ padding: '0.75rem' }}>GST_MOCK_ADAPTER</td>
              <td style={{ padding: '0.75rem' }}><StatusBadge status="VERIFIED" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default AuditPage;
