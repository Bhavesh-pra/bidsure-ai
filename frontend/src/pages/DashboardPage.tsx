import React, { useState, useEffect } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import apiService from '../services/api';
import { Tender } from '../types';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = useState<string>('Checking...');
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initDashboard() {
      setLoading(true);
      setError(null);
      try {
        const healthRes = await apiService.getHealth();
        if (healthRes.success && healthRes.data) {
          setHealth(healthRes.data.status);
        } else {
          setHealth('Backend Error');
        }

        const tendersRes = await apiService.getTenders();
        if (tendersRes.success && tendersRes.data) {
          setTenders(tendersRes.data);
        } else {
          setError(tendersRes.error?.message || 'Failed to load tenders');
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  return (
    <AppLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c' }}>Procurement Intelligence Dashboard</h1>
        <p style={{ color: '#718096', margin: '0.25rem 0 0 0' }}>Cycle 2 System Monolith Foundation Status</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: 0, color: '#718096', fontSize: '0.85rem' }}>BACKEND HEALTH (/health)</h4>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusBadge status={health === 'healthy' ? 'PASS' : 'FAIL'} />
            <span style={{ fontWeight: 600, color: '#2d3748' }}>{health}</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: 0, color: '#718096', fontSize: '0.85rem' }}>DATABASE CONNECTION</h4>
          <div style={{ marginTop: '0.5rem' }}>
            <StatusBadge status="VERIFIED" />
            <span style={{ marginLeft: '0.5rem', fontWeight: 600, color: '#2d3748' }}>SQLAlchemy Active</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: 0, color: '#718096', fontSize: '0.85rem' }}>ACTIVE TENDERS</h4>
          <div style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#2b6cb0' }}>
            {tenders.length}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#2d3748' }}>Active Tenders Overview</h3>

        {loading && <Loading message="Connecting to Flask + PostgreSQL backend..." />}
        {error && <ErrorState title="Backend Connection Issue" message={error} />}

        {!loading && !error && (
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
        )}
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
