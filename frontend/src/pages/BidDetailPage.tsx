import React from 'react';
import { useParams } from 'react_router_dom_shim';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';

export const BidDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <AppLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>Bid Details: {id || 'BID-001'}</h1>
        <p style={{ color: '#718096', margin: '0.25rem 0 0 0' }}>Bidder Submission & Analysis Pipeline</p>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>ABC Technologies Pvt Ltd</h3>
          <StatusBadge status="SUBMITTED" />
        </div>
        <p><strong>GSTIN:</strong> 27ABCDE1234F1Z5</p>
        <p><strong>PAN:</strong> ABCDE1234F</p>
        <p><strong>CIN:</strong> U72200MH2015PTC123456</p>
      </div>
    </AppLayout>
  );
};

export default BidDetailPage;
