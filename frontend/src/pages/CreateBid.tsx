import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { BidForm } from '../components/bidders/BidForm';
import { bidderService } from '../services/bidderService';
import { bidService } from '../services/bidService';
import type { Bidder } from '../types';
export default function CreateBidPage() { const { id } = useParams<{ id: string }>(); const nav = useNavigate(); const [bidders, setBidders] = React.useState<Bidder[]>([]); const [error, setError] = React.useState(''); React.useEffect(() => { void bidderService.list().then(r => setBidders(r.data)).catch(e => setError(e.message || 'Unable to load bidders')); }, []); return <Card title="Create Bid" subtitle="Submit a bidder's response to this tender">{error && <p className="mb-3 text-sm text-red-600">{error}</p>}<BidForm bidders={bidders} onSubmit={(v) => { if (!id) return; void bidService.create(id, v).then(r => nav(`/bids/${r.data.id}`)).catch(e => setError(e.message || 'Unable to create bid')); }} /></Card>; }
