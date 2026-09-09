import React from 'react';
import { useParams } from 'react_router_dom_shim';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';

export const TenderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <AppLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>Tender Detail: {id || 'TND-2026-001'}</h1>
        <p style={{ color: '#718096', margin: '0.25rem 0 0 0' }}>Tender specifications & compliance rules</p>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Supply and Installation of Server Infrastructure</h3>
          <StatusBadge status="PUBLISHED" />
        </div>
        <p><strong>Category:</strong> IT_INFRASTRUCTURE</p>
        <p><strong>Estimated Value:</strong> ₹50,000,000</p>
        <p><strong>Organization:</strong> Demo Procurement Organization</p>
      </div>
    </AppLayout>
  );
};

export default TenderDetailPage;
