import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <header style={{
      height: '60px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c', fontWeight: 700 }}>
          BidSure <span style={{ color: '#3182ce', fontSize: '0.85rem', fontWeight: 600 }}>AI Evaluation Engine</span>
        </h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#718096' }}>Organization: <strong>Demo Procurement Org</strong></span>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#3182ce',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          PO
        </div>
      </div>
    </header>
  );
};

export default Navbar;
