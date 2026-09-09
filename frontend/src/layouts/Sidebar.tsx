import React from 'react';
import { Link, useLocation } from 'react_router_dom_shim';

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Tenders', path: '/tenders' },
  { label: 'Bids', path: '/bids/BID-001' },
  { label: 'Verification', path: '/bids/BID-001/verification' },
  { label: 'Evidence', path: '/bids/BID-001/evidence' },
  { label: 'Decision', path: '/bids/BID-001/decision' },
  { label: 'Audit', path: '/bids/BID-001/audit' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#1a202c',
      color: '#edf2f7',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2d3748' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#63b3ed', letterSpacing: '0.05em' }}>🚀 BidSure AI</h3>
        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#a0aec0' }}>Cycle 2 Monolith</p>
      </div>

      <nav style={{ padding: '1rem 0', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '0.75rem 1.5rem',
                color: isActive ? '#ffffff' : '#cbd5e0',
                backgroundColor: isActive ? '#2b6cb0' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
