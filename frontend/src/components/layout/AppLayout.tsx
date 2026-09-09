import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, CheckSquare, AlertTriangle, UserCheck, History, Users } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: ShieldCheck },
    { label: 'Tenders', path: '/tenders', icon: FileText },
    { label: 'Bidders', path: '/bidders', icon: Users },
    { label: 'Bids & Evidence', path: '/bids', icon: CheckSquare },
    { label: 'Verifications', path: '/verifications', icon: AlertTriangle },
    { label: 'Officer Decision', path: '/decision', icon: UserCheck },
    { label: 'Audit Trail', path: '/audit', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-7 w-7 text-indigo-400" />
            <span className="font-bold text-lg tracking-tight">BidSure AI</span>
            <span className="text-xs bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded font-mono">
              SIH MVP
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-slate-300">
            <span>Procurement Officer (L3 Authority)</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};
