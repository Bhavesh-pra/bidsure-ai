import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  CheckSquare,
  AlertTriangle,
  UserCheck,
  History,
  Users,
  Search,
  Bell,
  User,
  LayoutDashboard,
} from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tenders', path: '/tenders', icon: FileText },
    { label: 'Bidders', path: '/bidders', icon: Users },
    { label: 'Bids & Evidence', path: '/bids', icon: CheckSquare },
    { label: 'Verifications', path: '/verifications', icon: AlertTriangle },
    { label: 'Officer Decision', path: '/decision', icon: UserCheck },
    { label: 'Audit Trail', path: '/audit', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 flex flex-col font-sans">
      {/* Enterprise Top Bar Header */}
      {!isLogin && (
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
          <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between gap-4">
            {/* Brand Logo & Tagline */}
            <div className="flex items-center space-x-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#0F2747] text-white shadow-xs">
                <ShieldCheck className="h-5.5 w-5.5 text-[#14B8A6]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base text-[#0F2747] tracking-tight">BidSure AI</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#ECFDF3] text-[#15803D] border border-[#A7F3D0] px-1.5 py-0.5 rounded-[4px]">
                    SIH 2026 Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">Evidence-Driven Bid Compliance Verification</p>
              </div>
            </div>

            {/* Right Quick Controls */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tenders, bids, GSTIN..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:bg-white transition-all"
                />
              </div>

              {/* Notification Indicator */}
              <button
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-[6px] transition-colors"
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#14B8A6]" />
              </button>

              <div className="h-5 w-[1px] bg-slate-200" />

              {/* Officer Profile */}
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-full bg-[#0F2747] flex items-center justify-center text-white font-semibold text-xs border border-[#183B63]">
                  <User className="h-4 w-4 text-[#14B8A6]" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">Procurement Officer</p>
                  <p className="text-[11px] text-slate-500">L3 Decision Authority</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Layout Container */}
      <div className={`flex-1 flex w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 gap-6 ${isLogin ? 'justify-center' : ''}`}>
        {/* Enterprise Left Sidebar */}
        {!isLogin && (
          <aside className="w-60 flex-shrink-0">
            <div className="sticky top-22 space-y-4">
              <nav className="bg-white rounded-[8px] border border-slate-200 p-2 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Navigation
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-[6px] text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#0F2747] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#14B8A6]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Officer Role Card */}
              <div className="bg-[#0F2747] rounded-[8px] p-3.5 text-white shadow-xs border border-[#183B63]">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse" />
                  <span className="text-[11px] font-semibold text-slate-200">System Connected</span>
                </div>
                <p className="mt-2 text-xs font-bold text-white">Government Procurement</p>
                <p className="text-[11px] text-slate-300 mt-0.5">Evidence Chain Verified</p>
              </div>
            </div>
          </aside>
        )}

        {/* Content Area */}
        <main className={`min-w-0 ${isLogin ? 'w-full' : 'flex-1'}`}>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
