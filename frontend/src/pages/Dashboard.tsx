import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { TenderStatusBadge } from '../components/tenders/TenderStatusBadge';
import { tenderService } from '../services/tenderService';
import { bidService } from '../services/bidService';
import type { Tender, Bid } from '../types';

export const DashboardPage: React.FC = () => {
  const [tenders, setTenders] = React.useState<Tender[]>([]);
  const [bids, setBids] = React.useState<Bid[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  React.useEffect(() => { void (async () => { try { const tenderResponse = await tenderService.getTenders(); const loadedTenders = tenderResponse.data; setTenders(loadedTenders); const bidResponses = await Promise.all(loadedTenders.slice(0, 5).map((tender) => bidService.list(tender.id).catch(() => ({ data: { tender_id: tender.id, bids: [] } } as any)))); setBids(bidResponses.flatMap((response) => response.data.bids || [])); } catch (err: any) { setError(err?.message || 'Unable to load dashboard.'); } finally { setLoading(false); } })(); }, []);
  const activeTenders = tenders.filter((tender) => tender.status === 'ACTIVE');
  if (loading) return <Card title="Procurement Dashboard"><Loading message="Loading procurement overview..." /></Card>;
  if (error) return <Card title="Procurement Dashboard"><ErrorState title="Unable to load dashboard" message={error} /><Link to="/tenders"><Button variant="outline">Open Tenders</Button></Link></Card>;
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">BidSure AI</p><h1 className="text-2xl font-bold text-slate-900">Procurement Compliance Dashboard</h1></div><Link to="/tenders"><Button variant="outline">View All Tenders</Button></Link></div><Card title="Active Tenders" subtitle="Select a tender to review its bidders and submissions.">{activeTenders.length ? <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Tender</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Title</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Bids</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Status</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{activeTenders.map((tender) => <tr key={tender.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium"><Link className="text-indigo-600 hover:underline" to={`/tenders/${tender.id}`}>{tender.tender_number}</Link></td><td className="px-4 py-3">{tender.title}</td><td className="px-4 py-3">{bids.filter((bid) => bid.tender_id === tender.id).length}</td><td className="px-4 py-3"><TenderStatusBadge status={tender.status} /></td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">No active tenders found.</p>}</Card><Card title="Recent Bids" subtitle="Open a bid to review its documents and evidence.">{bids.length ? <div className="divide-y divide-slate-100">{bids.slice(0, 5).map((bid) => <Link key={bid.id} to={`/bids/${bid.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-slate-50"><span className="font-medium text-slate-800">{bid.bidder?.legal_name || bid.bidder_id}</span><span className="text-sm text-slate-500">{bid.status}</span></Link>)}</div> : <p className="text-sm text-slate-500">No bids available yet.</p>}</Card></div>;
};

export default DashboardPage;
