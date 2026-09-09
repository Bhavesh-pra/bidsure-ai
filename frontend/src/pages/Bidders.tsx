import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { BidderCard } from '../components/bidders/BidderCard';
import { BidderForm } from '../components/bidders/BidderForm';
import { bidderService } from '../services/bidderService';
import type { Bidder } from '../types';
import { Users, Plus } from 'lucide-react';

export default function BiddersPage() {
  const [bidders, setBidders] = React.useState<Bidder[]>([]);
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = () => {
    setLoading(true);
    setError('');
    void bidderService
      .list()
      .then((r) => setBidders(r.data))
      .catch((e) => setError(e.message || 'Unable to load bidders'))
      .finally(() => setLoading(false));
  };

  React.useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F766E]">
            <Users className="h-4 w-4" />
            <span>Procurement Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-0.5">Bidders Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered vendor organizations, GSTIN profiles, and PAN compliance records.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShow(!show)}
          className="flex items-center space-x-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>{show ? 'Cancel' : 'Add New Bidder'}</span>
        </Button>
      </div>

      {error && (
        <ErrorState
          title="Unable to load bidders"
          message={error}
          action={
            <Button size="sm" variant="outline" onClick={load}>
              Retry
            </Button>
          }
        />
      )}

      {show && (
        <Card title="Register New Vendor / Bidder" subtitle="Provide company registration numbers (GSTIN, PAN) for cross-verification">
          <BidderForm
            onSubmit={(v) =>
              void bidderService
                .create(v)
                .then(() => {
                  setShow(false);
                  load();
                })
                .catch((e) => setError(e.message || 'Unable to create bidder'))
            }
          />
        </Card>
      )}

      {loading ? (
        <Loading message="Loading vendor directory..." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bidders.map((b) => (
            <BidderCard key={b.id} bidder={b} />
          ))}
          {!bidders.length && !error && (
            <div className="col-span-2">
              <EmptyState title="No registered bidders" message="Click 'Add New Bidder' to create a vendor profile." />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
