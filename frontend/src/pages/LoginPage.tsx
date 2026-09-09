import React from 'react';
import { useNavigate } from 'react_router_dom_shim';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#edf2f7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ textAlign: 'center', color: '#2b6cb0', marginTop: 0 }}>BidSure AI Login</h2>
        <p style={{ textAlign: 'center', color: '#718096', fontSize: '0.9rem' }}>Procurement Compliance Portal</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.25rem' }}>Email</label>
            <input type="email" defaultValue="officer@bidsure.ai" required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.25rem' }}>Password</label>
            <input type="password" defaultValue="••••••••" required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
