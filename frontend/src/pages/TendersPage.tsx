import React from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';
import { useApi } from '../hooks/useApi';
import apiService from '../services/api';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';

export const TendersPage: React.FC = () => {
  const { data: tenders, loading, error } = useApi(() => apiService.getTenders());

  return (
    <AppLayout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>Tenders List</h1>
          <p style={{ color: '#718096', margin: '0.25rem 0 0 0' }}>Manage and evaluate procurement tender requirements</p>
        </div>
      </div>

      {loading && <Loading message="Fetching tenders from PostgreSQL..." />}
      {error && <ErrorState message={error} />}

      {!loading && !error && tenders && (
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #edf2f7', color: '#718096', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem' }}>TENDER ID</th>
                <th style={{ padding: '0.75rem' }}>TITLE</th>
                <th style={{ padding: '0.75rem' }}>CATEGORY</th>
                <th style={{ padding: '0.75rem' }}>ESTIMATED VALUE</th>
                <th style={{ padding: '0.75rem' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #edf2f7', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#3182ce' }}>{t.id}</td>
                  <td style={{ padding: '0.75rem' }}>{t.title}</td>
                  <td style={{ padding: '0.75rem' }}>{t.category}</td>
                  <td style={{ padding: '0.75rem' }}>₹{t.estimated_value?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '0.75rem' }}><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
};

export default TendersPage;
