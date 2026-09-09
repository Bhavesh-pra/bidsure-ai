import React from 'react';
import { Card } from '../components/ui/Card';
import { BidderCard } from '../components/bidders/BidderCard';
import { BidderForm } from '../components/bidders/BidderForm';
import { bidderService } from '../services/bidderService';
import type { Bidder } from '../types';
export default function BiddersPage() { const [bidders, setBidders] = React.useState<Bidder[]>([]); const [show, setShow] = React.useState(false); const [error, setError] = React.useState(''); const load = () => void bidderService.list().then(r => setBidders(r.data)).catch(e => setError(e.message || 'Unable to load bidders')); React.useEffect(load, []); return <div className="space-y-5"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Bidders</h1><button className="rounded bg-indigo-600 px-4 py-2 text-sm text-white" onClick={() => setShow(!show)}>Add Bidder</button></div>{error && <p className="text-sm text-red-600">{error}</p>}{show && <Card title="Add Bidder"><BidderForm onSubmit={(v) => void bidderService.create(v).then(() => { setShow(false); load(); }).catch(e => setError(e.message || 'Unable to create bidder'))} /></Card>}<div className="grid gap-4 md:grid-cols-2">{bidders.map(b => <BidderCard key={b.id} bidder={b} />)}</div></div>; }
