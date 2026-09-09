import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TenderStatusBadge } from '../components/tenders/TenderStatusBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { tenderService } from '../services/tenderService';
import { bidService } from '../services/bidService';
import type { Tender, Bid } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Activity,
  FileCheck,
  AlertCircle,
  Filter,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tenders, setTenders] = React.useState<Tender[]>([]);
  const [bids, setBids] = React.useState<Bid[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [filterTab, setFilterTab] = React.useState<'ALL' | 'PENDING' | 'CRITICAL' | 'VERIFIED'>('ALL');

  React.useEffect(() => {
    void (async () => {
      try {
        const tenderResponse = await tenderService.getTenders();
        const loadedTenders = tenderResponse.data;
        setTenders(loadedTenders);

        const bidResponses = await Promise.all(
          loadedTenders.slice(0, 5).map((tender) =>
            bidService.list(tender.id).catch(() => ({ data: { tender_id: tender.id, bids: [] } } as any))
          )
        );
        setBids(bidResponses.flatMap((response) => response.data.bids || []));
      } catch (err: any) {
        setError(err?.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeTenders = tenders.filter((tender) => tender.status === 'ACTIVE');
  const pendingReviews = bids.filter(
    (b) => b.status === 'UNDER_REVIEW' || b.status === 'PENDING' || b.status === 'REVIEW' || b.status === 'SUBMITTED'
  );
  const pendingReviewsCount = pendingReviews.length || Math.min(bids.length, 2);
  const highRiskBids = bids.filter((b) => b.status === 'REJECTED' || b.status === 'DISQUALIFIED');
  const highRiskCount = highRiskBids.length || 0;
  const verifiedBids = bids.filter((b) => b.status === 'QUALIFIED' || b.status === 'APPROVED');

  // Chart dataset for compliance distribution
  const chartData = [
    { name: 'Low Risk / Passed', count: Math.max(1, bids.length - highRiskCount - pendingReviewsCount), color: '#15803D' },
    { name: 'Under Review', count: pendingReviewsCount, color: '#B45309' },
    { name: 'High Risk / Failed', count: highRiskCount, color: '#B91C1C' },
  ];

  const filteredBids = React.useMemo(() => {
    if (filterTab === 'PENDING') return pendingReviews;
    if (filterTab === 'CRITICAL') return highRiskBids;
    if (filterTab === 'VERIFIED') return verifiedBids;
    return bids;
  }, [bids, filterTab, pendingReviews, highRiskBids, verifiedBids]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState title="Unable to load procurement dashboard" message={error} />
        <Link to="/tenders">
          <Button variant="outline">Open Tenders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />

      {/* Officer Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F766E]">
            <ShieldCheck className="h-4 w-4" />
            <span>Procurement Officer Command Center · {user?.organization_name || 'Department of Heavy Industries'}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-1">
            Good morning, {user?.name || 'Officer'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor active tender evaluations, AI-assisted evidence verifications, and statutory determinations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link to="/tenders/new">
            <Button variant="secondary" size="sm" className="flex items-center space-x-1.5 shadow-2xs font-semibold">
              <span>+ Create Tender</span>
            </Button>
          </Link>
          <Link to="/bids">
            <Button variant="outline" size="sm" className="font-medium">
              View All Bids
            </Button>
          </Link>
          <Link to="/audit">
            <Button variant="ghost" size="sm" className="text-slate-600 font-medium">
              Audit Trail
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tenders */}
        <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Tenders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#EFF6FF] text-[#2563EB]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#0F2747]">{activeTenders.length}</span>
            <span className="inline-flex items-center text-[11px] font-semibold text-[#15803D]">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              Active cases
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Published & accepting bids</p>
        </div>

        {/* Pending Reviews */}
        <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Reviews</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FFFBEB] text-[#B45309]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#0F2747]">{pendingReviewsCount}</span>
            <span className="text-[11px] font-semibold text-[#B45309]">Requires Officer Action</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Manual verification required</p>
        </div>

        {/* Bids Under Verification */}
        <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bids Evaluated</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#ECFDF3] text-[#15803D]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#0F2747]">{bids.length}</span>
            <span className="text-[11px] font-semibold text-[#15803D]">OCR & Rule Checked</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Across active procurement cases</p>
        </div>

        {/* High Risk Cases */}
        <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">High Risk Flags</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FEF2F2] text-[#B91C1C]">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#0F2747]">{highRiskCount}</span>
            <span className="text-[11px] font-semibold text-[#B91C1C]">Compliance Critical</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Failed mandatory rules</p>
        </div>
      </div>

      {/* Action Required / Officer Work Queue */}
      <div className="rounded-[8px] border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-slate-50 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 font-semibold text-xs">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F2747]">Action Required (Next Steps)</h2>
              <p className="text-[11px] text-slate-600">
                High-priority compliance items awaiting Officer verification & final determination
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
            {pendingReviews.length} Action Item{pendingReviews.length !== 1 ? 's' : ''}
          </span>
        </div>

        {pendingReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingReviews.slice(0, 3).map((bid) => (
              <div
                key={bid.id}
                className="flex flex-col justify-between rounded-[6px] border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-[#0F766E]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#0F2747] truncate">
                      {bid.bidder?.legal_name || `Bidder #${bid.bidder_id}`}
                    </span>
                    <StatusBadge status={bid.status || 'PENDING'} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 truncate">
                    Tender: {bid.tender?.title || `Tender #${bid.tender_id}`}
                  </p>
                  <p className="mt-1 text-[11px] text-amber-700 font-medium flex items-center">
                    <Clock className="h-3 w-3 mr-1 inline shrink-0" />
                    OCR Verification & Mandatory Rules Pending
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                  <Link to={`/bids/${bid.id}`}>
                    <Button size="sm" variant="secondary" className="text-xs py-1 h-7">
                      Review Case →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-3 rounded-[6px] border border-slate-200">
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-[#15803D] mr-2 shrink-0" />
              All submitted bids have been verified. No pending compliance actions in queue.
            </span>
            <Link to="/tenders">
              <Button size="sm" variant="outline" className="text-xs h-7">
                Browse Tenders
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Analytics & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Distribution Chart */}
        <Card title="Compliance Risk Distribution" subtitle="Overview of evaluated bids by compliance risk level" className="lg:col-span-2">
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F2747', borderRadius: '6px', color: '#FFF', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Audit / Workflow Guide */}
        <Card title="Verification Workflow" subtitle="BidSure AI evidence processing model">
          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-center space-x-3 p-2.5 rounded-[6px] bg-slate-50 border border-slate-200">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0F2747] text-white font-bold text-[10px]">1</div>
              <div>
                <p className="font-semibold text-slate-900">Tender Requirements Extracted</p>
                <p className="text-slate-500">PDF specs parsed into deterministic rules</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2.5 rounded-[6px] bg-slate-50 border border-slate-200">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0F766E] text-white font-bold text-[10px]">2</div>
              <div>
                <p className="font-semibold text-slate-900">OCR & Evidence Extraction</p>
                <p className="text-slate-500">GSTIN, PAN, OEM letters mapped to page & field</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2.5 rounded-[6px] bg-[#ECFDF3] border border-[#A7F3D0]">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#15803D] text-white font-bold text-[10px]">3</div>
              <div>
                <p className="font-semibold text-[#15803D]">Officer Decision</p>
                <p className="text-slate-600">Officer records binding decision with audit log</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Tenders Overview Table */}
      <Card
        title="Active Tender Pipeline"
        subtitle="Select a tender to review bidder submissions and extracted evidence"
        action={
          <Link to="/tenders" className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        }
      >
        {activeTenders.length ? (
          <div className="overflow-x-auto rounded-[6px] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">Tender ID</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">Tender Title</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">Submissions</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">Deadline</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activeTenders.map((tender) => {
                  const tenderBidsCount = bids.filter((bid) => bid.tender_id === tender.id).length;
                  return (
                    <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#0F2747]">
                        <Link to={`/tenders/${tender.id}`} className="hover:underline">
                          {tender.tender_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate" title={tender.title}>
                        {tender.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {tenderBidsCount} bid(s) submitted
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {tender.submission_deadline
                          ? new Date(tender.submission_deadline).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <TenderStatusBadge status={tender.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/tenders/${tender.id}`}>
                          <Button size="sm" variant="outline">
                            View Case
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No active tenders available.</p>
        )}
      </Card>

      {/* Filterable Bidder Compliance Registry */}
      <Card
        title="Bidder Compliance Registry"
        subtitle="Filter submissions by verification state and launch compliance evaluation cockpit directly"
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors ${
                filterTab === 'ALL'
                  ? 'bg-[#0F2747] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({bids.length})
            </button>
            <button
              onClick={() => setFilterTab('PENDING')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors ${
                filterTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Pending ({pendingReviews.length})
            </button>
            <button
              onClick={() => setFilterTab('CRITICAL')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors ${
                filterTab === 'CRITICAL'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Critical Flags ({highRiskCount})
            </button>
            <button
              onClick={() => setFilterTab('VERIFIED')}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors ${
                filterTab === 'VERIFIED'
                  ? 'bg-[#15803D] text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Qualified ({verifiedBids.length})
            </button>
          </div>
        }
      >
        {filteredBids.length ? (
          <div className="divide-y divide-slate-100">
            {filteredBids.slice(0, 8).map((bid) => (
              <div
                key={bid.id}
                className="flex flex-wrap items-center justify-between gap-4 py-3 hover:bg-slate-50/80 transition-colors px-2 rounded-[4px]"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[#0F2747] shrink-0">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-xs text-slate-900 truncate">
                        {bid.bidder?.legal_name || `Bidder ID: ${bid.bidder_id}`}
                      </p>
                      {bid.compliance_score !== undefined && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {bid.compliance_score}% Score
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Quoted: ₹{Number(bid.quoted_amount || 0).toLocaleString('en-IN')} · Tender: {bid.tender?.title || bid.tender_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <StatusBadge status={bid.status || 'PENDING'} />
                  <Link to={`/bids/${bid.id}/verification`}>
                    <Button size="sm" variant="secondary" className="text-xs py-1 h-7 font-semibold">
                      Verify Bid →
                    </Button>
                  </Link>
                  <Link to={`/bids/${bid.id}`}>
                    <Button size="sm" variant="outline" className="text-xs py-1 h-7">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">No bids matching the selected filter.</p>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
