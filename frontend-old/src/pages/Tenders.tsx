import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { EmptyTenderState } from '../components/tenders/EmptyTenderState';
import { TenderTable } from '../components/tenders/TenderTable';
import { tenderService } from '../services/tenderService';
import type { Tender } from '../types/tender';
import { Plus, Search, FileText } from 'lucide-react';

const messageFor = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to load tenders.';

export const TendersPage: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');

  const loadTenders = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await tenderService.getTenders();
      setTenders(response.data);
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTenders();
  }, [loadTenders]);

  const filteredTenders = useMemo(() => {
    if (!searchQuery.trim()) return tenders;
    const q = searchQuery.toLowerCase();
    return tenders.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.tender_number.toLowerCase().includes(q) ||
        (t.organization || '').toLowerCase().includes(q)
    );
  }, [tenders, searchQuery]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Tenders Pipeline' }]} />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F766E]">
            <FileText className="h-4 w-4" />
            <span>Procurement Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-0.5">Tenders & Specifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active procurement notices, document extraction status, and deterministic compliance rules.
          </p>
        </div>

        <Link to="/tenders/new">
          <Button variant="primary" size="sm" className="flex items-center space-x-1.5">
            <Plus className="h-4 w-4" />
            <span>Create New Tender</span>
          </Button>
        </Link>
      </div>

      <Card>
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tender title, tender number, or organization..."
              className="w-full rounded-[6px] border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] transition-all"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredTenders.length}</strong> of {tenders.length} tender(s)
          </span>
        </div>

        {loading && <Loading message="Loading active procurement tenders..." />}
        {!loading && error && (
          <div>
            <ErrorState title="Unable to load tenders" message={error} />
            <div className="px-6 pb-6 pt-2">
              <Button variant="outline" size="sm" onClick={() => void loadTenders()}>
                Retry
              </Button>
            </div>
          </div>
        )}
        {!loading && !error && tenders.length === 0 && <EmptyTenderState />}
        {!loading && !error && tenders.length > 0 && <TenderTable tenders={filteredTenders} />}
      </Card>
    </div>
  );
};

export default TendersPage;
