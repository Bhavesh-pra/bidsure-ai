import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import {
  ArrowLeft,
  ClipboardCheck,
  Clock3,
  FileCheck,
  History,
  RotateCw,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import {
  officerDecisionStore,
  type AuditEventItem,
  type OfficerDecision,
} from '../services/officerDecisionStore';
import { bidService } from '../services/bidService';
import type { Bid } from '../types';

export const BidAuditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [bid, setBid] = React.useState<Bid | null>(null);
  const [events, setEvents] = React.useState<AuditEventItem[]>([]);
  const [decision, setDecision] = React.useState<OfficerDecision | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadAuditData = async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const [bidResp, auditItems, dec] = await Promise.all([
        bidService.get(id).catch(() => null),
        officerDecisionStore.fetchAudit(id),
        officerDecisionStore.fetchDecision(id),
      ]);
      if (bidResp?.data) setBid(bidResp.data);
      setEvents(auditItems || []);
      setDecision(dec);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit trail.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    void loadAuditData(true);
  }, [id]);

  if (loading) {
    return (
      <Card title="Bid Audit Trail">
        <Loading message="Loading immutable audit logs..." />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            className="mb-2 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
            to={`/bids/${id}/verification`}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to verification results
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Bid Audit Trail & History</h1>
          <p className="text-sm text-slate-500">
            Bid ID: <span className="font-mono">{id}</span> ·{' '}
            {bid?.bidder?.legal_name || 'Bidder'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadAuditData(false)}
            isLoading={refreshing}
            className="flex items-center gap-1.5"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <Link to={`/bids/${id}/decision`}>
            <Button size="sm" variant="primary">
              Record Decision
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Bid Status">
          <p className="text-xl font-bold text-slate-900">{bid?.status || 'PENDING'}</p>
          <p className="text-xs text-slate-500 mt-1">Current lifecycle state</p>
        </Card>
        <Card title="Officer Verdict">
          <p className="text-xl font-bold text-emerald-700">
            {decision ? decision.action.replace(/_/g, ' ') : 'NOT RECORDED'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {decision ? `By ${decision.actor}` : 'Pending administrative decision'}
          </p>
        </Card>
        <Card title="Recorded Audit Events">
          <p className="text-xl font-bold text-indigo-600">{events.length}</p>
          <p className="text-xs text-slate-500 mt-1">Immutable PostgreSQL log entries</p>
        </Card>
      </div>

      {/* Chronological Audit Stream */}
      <Card
        title="Chronological Audit Timeline"
        subtitle="Cryptographically tracked and tamper-evident event log for procurement compliance verification."
      >
        {events.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {events.map((event, index) => {
              const isDecision = event.action.includes('DECISION');
              const isVerification = event.action.includes('VERIFICATION');

              return (
                <div key={event.id || index} className="relative group">
                  <div
                    className={`absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                      isDecision
                        ? 'bg-emerald-500 text-white'
                        : isVerification
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-400 text-white'
                    }`}
                  >
                    {isDecision ? (
                      <ClipboardCheck className="h-3 w-3" />
                    ) : isVerification ? (
                      <FileCheck className="h-3 w-3" />
                    ) : (
                      <Clock3 className="h-3 w-3" />
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isDecision
                              ? 'bg-emerald-100 text-emerald-800'
                              : isVerification
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {event.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{event.id}</span>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                        {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Recent'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700">
                      Executed by: <strong>{event.user_name || 'System'}</strong>
                    </p>

                    {event.remarks && (
                      <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700">
                        <span className="font-semibold text-slate-900 block mb-0.5">Remarks:</span>
                        {event.remarks}
                      </div>
                    )}

                    {event.new_state && (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                        {event.new_state.status && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                            <Tag className="h-3 w-3 text-slate-400" />
                            Status: <strong>{event.new_state.status}</strong>
                          </span>
                        )}
                        {event.new_state.score !== undefined && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                            Score: <strong>{event.new_state.score}%</strong>
                          </span>
                        )}
                        {event.new_state.risk && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                            Risk: <strong>{event.new_state.risk}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No audit trail records yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Audit events will appear here once verification is executed or an officer decision is submitted.
            </p>
            <div className="mt-4">
              <Link to={`/bids/${id}/verification`}>
                <Button size="sm">Go to Verification</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BidAuditPage;
