import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BidForm } from '../components/bidders/BidForm';
import { bidderService } from '../services/bidderService';
import { bidService } from '../services/bidService';
import type { Bidder } from '../types';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to={activeTenderId ? `/tenders/${activeTenderId}` : '/tenders'}
          className="text-xs text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Tender
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
