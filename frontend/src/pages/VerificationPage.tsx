import React from 'react';
import { useParams } from 'react_router_dom_shim';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';

export const VerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <AppLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>External API Verification: {id || 'BID-001'}</h1>
        <p style={{ color: '#718096', margin: '0.25rem 0 0 0' }}>Government Registry & Adapter Verification Matrix</p>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #edf2f7', color: '#718096', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.75rem' }}>REQUIREMENT ID</th>
              <th style={{ padding: '0.75rem' }}>TYPE</th>
              <th style={{ padding: '0.75rem' }}>SOURCE</th>
              <th style={{ padding: '0.75rem' }}>MATCH RESULT</th>
              <th style={{ padding: '0.75rem' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #edf2f7', fontSize: '0.9rem' }}>
              <td style={{ padding: '0.75rem', fontWeight: 600 }}>REQ-001</td>
              <td style={{ padding: '0.75rem' }}>GST_STATUS</td>
              <td style={{ padding: '0.75rem' }}>GST_MOCK_ADAPTER</td>
              <td style={{ padding: '0.75rem', color: 'green', fontWeight: 600 }}>MATCH (TRUE)</td>
              <td style={{ padding: '0.75rem' }}><StatusBadge status="VERIFIED" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default VerificationPage;
