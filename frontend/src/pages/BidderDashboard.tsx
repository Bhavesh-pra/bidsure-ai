import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useAuth } from '../contexts/AuthContext';
import { tenderService } from '../services/tenderService';
import { bidService } from '../services/bidService';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { Tender, Bid } from '../types';
import {
  FileText,
  Briefcase,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const BidderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      tenderService.getTenders().catch(() => ({ data: { tenders: [] } })),
      bidService.listAll().catch(() => ({ data: { bids: [] } })),
    ])
      .then(([tendersRes, bidsRes]) => {
        const tenderList = Array.isArray(tendersRes.data) ? tendersRes.data : tendersRes.data?.tenders || [];
        const bidList = Array.isArray(bidsRes.data) ? bidsRes.data : bidsRes.data?.bids || [];
        setTenders(tenderList);
        setBids(bidList);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeTenders = tenders.filter((t) => t.status === 'ACTIVE');
  const submittedBids = bids.length;
  const pendingBids = bids.filter((b) => b.status === 'SUBMITTED' || b.status === 'PENDING' || b.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Vendor Dashboard' }]} />

      {/* Welcome Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">
            Welcome, {user?.name || 'Bidder'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {user?.organization_name || 'Your Organization'} — Vendor Portal
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Tenders</span>
              <span className="text-2xl font-extrabold text-[#0F2747]">{activeTenders.length}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Submitted Bids</span>
              <span className="text-2xl font-extrabold text-[#0F2747]">{submittedBids}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Review</span>
              <span className="text-2xl font-extrabold text-[#0F2747]">{pendingBids}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Tenders */}
      <Card title="Open Tenders" subtitle="Tenders currently accepting bid submissions">
        {loading ? (
          <p className="text-xs text-slate-500 py-4 text-center">Loading tenders...</p>
        ) : activeTenders.length > 0 ? (
          <div className="space-y-3">
            {activeTenders.slice(0, 5).map((tender) => (
              <div
                key={tender.id}
                className="flex items-center justify-between rounded-[6px] border border-slate-200 bg-slate-50/60 p-3.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0F2747] truncate">{tender.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tender {tender.id} • {tender.category || 'General'}
                  </p>
                </div>
                <Link to={`/tenders/${tender.id}`}>
                  <Button size="sm" variant="secondary" className="text-xs">
                    View Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No active tenders at this time.</p>
        )}
      </Card>

      {/* My Bids */}
      <Card title="My Bids" subtitle="Submitted bids and their verification status">
        {loading ? (
          <p className="text-xs text-slate-500 py-4 text-center">Loading bids...</p>
        ) : bids.length > 0 ? (
          <div className="space-y-3">
            {bids.slice(0, 5).map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between rounded-[6px] border border-slate-200 bg-slate-50/60 p-3.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0F2747]">Bid {bid.id}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tender: {bid.tender_id}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={bid.status || 'SUBMITTED'} />
                  <Link to={`/bids/${bid.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No bids submitted yet.</p>
            <Link to="/tenders" className="mt-2 inline-block">
              <Button size="sm" variant="primary" className="text-xs">
                Browse Active Tenders
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BidderDashboard;
