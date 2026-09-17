import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { bidService } from '../services/bidService';
import type { Bid } from '../types';
import {
  FileText,
  Building2,
  Calendar,
  IndianRupee,
  Search,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';

export const BidsPage: React.FC = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadBids = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bidService.listAll();
      setBids(response.data.bids || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load bids.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBids();
  }, []);

  const filteredBids = useMemo(() => {
    if (!searchQuery.trim()) return bids;
    const q = searchQuery.toLowerCase();
    return bids.filter((b) => {
      const bidderName = (b.bidder?.legal_name || '').toLowerCase();
      const tenderTitle = (b.tender?.title || '').toLowerCase();
      const tenderNum = (b.tender?.tender_number || '').toLowerCase();
      const bidId = (b.id || '').toLowerCase();
      return (
        bidderName.includes(q) ||
        tenderTitle.includes(q) ||
        tenderNum.includes(q) ||
        bidId.includes(q)
      );
    });
  }, [bids, searchQuery]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Bids & Evidence Directory' }]} />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">Bids & Evidence Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of submitted bids across active tenders. Inspect uploaded files, OCR evidence, and officer decision state.
          </p>
        </div>

        <Link to="/tenders">
          <Button variant="outline" size="sm">
            View Tenders
          </Button>
        </Link>
      </div>

      {/* Main Container Card */}
      <Card>
        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bidder name, tender number, or Bid ID..."
              className="w-full rounded-[6px] border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] transition-all"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredBids.length}</strong> of {bids.length} bid(s)
          </span>
        </div>

        {/* Content States */}
        {loading ? (
          <Loading message="Loading submitted bids..." />
        ) : error ? (
          <div>
            <ErrorState title="Unable to load bids" message={error} />
            <div className="px-6 pb-6 pt-2">
              <Button variant="outline" size="sm" onClick={() => void loadBids()}>
                Retry
              </Button>
            </div>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#0F2747] mb-3 border border-slate-200">
              <CheckSquare className="h-6 w-6 text-[#0F766E]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              {searchQuery ? 'No matching bids found' : 'No bids submitted yet'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'Bids will appear here once submitted against tenders. Open an active tender to create a new bid.'}
            </p>
            {!searchQuery && (
              <div className="mt-4">
                <Link to="/tenders">
                  <Button size="sm" variant="primary">Go to Tenders</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-[6px] border border-slate-200 overflow-hidden bg-white">
            {filteredBids.map((bid) => (
              <div
                key={bid.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/80 transition-colors gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-[#0F2747] text-sm">
                      {bid.bidder?.legal_name || bid.bidder_id}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[11px] font-semibold text-[#15803D] border border-[#A7F3D0]">
                      {bid.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center text-slate-700 font-medium">
                      <FileText className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {bid.tender?.title || bid.tender_id}
                    </span>
                    {bid.tender?.tender_number && (
                      <span className="font-mono text-slate-400 text-[11px]">
                        ({bid.tender.tender_number})
                      </span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {bid.submission_time || bid.created_at
                        ? new Date(bid.submission_time || bid.created_at!).toLocaleDateString('en-IN')
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Quoted Amount</span>
                    <span className="font-bold text-sm text-[#0F2747]">
                      ₹{Number(bid.quoted_amount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link to={`/bids/${bid.id}`}>
                    <Button size="sm" variant="outline" className="flex items-center space-x-1">
                      <span>Manage Documents</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default BidsPage;
