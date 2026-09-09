import React from 'react';
import { Card } from '../components/ui/Card';
import { useParams } from 'react-router-dom';
import { bidService } from '../services/bidService';
import type { Bid } from '../types';

export const BidDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [bid, setBid] = React.useState<Bid>();
  const [error, setError] = React.useState('');
  React.useEffect(() => { if (id) void bidService.get(id).then(r => setBid(r.data)).catch(e => setError(e.message || 'Unable to load bid')); }, [id]);
  return (
    <Card title={`Bid ${id ?? ''}`} subtitle="Bid details and metadata">
      {error ? <p className="text-sm text-red-600">{error}</p> : bid ? <dl className="grid gap-4 sm:grid-cols-2 text-sm"><div><dt className="text-slate-500">Tender</dt><dd className="font-medium">{bid.tender?.title || bid.tender_id}</dd></div><div><dt className="text-slate-500">Bidder</dt><dd className="font-medium">{bid.bidder?.legal_name || bid.bidder_id}</dd></div><div><dt className="text-slate-500">Quoted Amount</dt><dd className="font-medium">₹{Number(bid.quoted_amount).toLocaleString('en-IN')}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="font-medium">{bid.status}</dd></div></dl> : <p className="text-sm text-slate-600">Loading bid...</p>}
    </Card>
  );
};

export default BidDetailsPage;
