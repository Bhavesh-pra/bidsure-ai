import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { BidForm } from '../components/bidders/BidForm';
import { bidderService } from '../services/bidderService';
import { bidService } from '../services/bidService';
import type { Bidder } from '../types';
import { FileCheck } from 'lucide-react';

export default function CreateBidPage() {
  const { id, tenderId } = useParams<{ id?: string; tenderId?: string }>();
  const activeTenderId = tenderId || id;
  const nav = useNavigate();
  const [bidders, setBidders] = React.useState<Bidder[]>([]);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    void bidderService
      .list()
      .then((r) => setBidders(r.data))
      .catch((e) => setError(e.message || 'Unable to load bidders'));
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Tenders', href: '/tenders' },
          {
            label: activeTenderId ? `Tender #${activeTenderId}` : 'Tender Details',
            href: activeTenderId ? `/tenders/${activeTenderId}` : '/tenders',
          },
          { label: 'Create New Bid' },
        ]}
      />

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F766E]">
            <FileCheck className="h-4 w-4" />
            <span>Bid Submission Entry</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-0.5">Submit Bidder Proposal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register a vendor commercial response against Tender #{activeTenderId || '—'}
          </p>
        </div>

        <Link to={activeTenderId ? `/tenders/${activeTenderId}` : '/tenders'}>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>

      <Card title="Create Bid" subtitle="Submit a bidder's response to this tender">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {!activeTenderId ? (
          <p className="text-sm text-red-600">No Tender ID specified in route.</p>
        ) : (
          <BidForm
            bidders={bidders}
            onSubmit={(v) => {
              void bidService
                .create(activeTenderId, v)
                .then((r) => nav(`/bids/${r.data.id}`))
                .catch((e) => setError(e.message || 'Unable to create bid'));
            }}
          />
        )}
      </Card>
    </div>
  );
}
