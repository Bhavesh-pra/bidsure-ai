import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { ArrowLeft, CheckCircle2, ClipboardCheck, History, ShieldAlert } from 'lucide-react';
import {
  officerDecisionStore,
  type OfficerDecision,
  type OfficerDecisionAction,
} from '../services/officerDecisionStore';
import { bidService } from '../services/bidService';
import type { Bid } from '../types';

export const BidDecisionPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [bid, setBid] = React.useState<Bid | null>(null);
  const [decision, setDecision] = React.useState<OfficerDecision | null>(() =>
    id ? officerDecisionStore.get(id) : null
  );
  const [pending, setPending] = React.useState<OfficerDecisionAction | null>(null);
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    void Promise.all([
      bidService.get(id).catch(() => null),
      officerDecisionStore.fetchDecision(id).catch(() => null),
    ])
      .then(([bidResp, fetchedDecision]) => {
        if (bidResp?.data) setBid(bidResp.data);
        if (fetchedDecision) setDecision(fetchedDecision);
      })
      .catch((err: any) => setError(err?.message || 'Failed to load bid data'))
      .finally(() => setLoading(false));
  }, [id]);

  const confirm = async () => {
    if (!id || !pending) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const saved = await officerDecisionStore.submitDecision(id, pending, note.trim() || undefined);
      setDecision(saved);
      setPending(null);
      setNote('');
      setSuccess(`Decision "${saved.action.replace(/_/g, ' ')}" successfully recorded in the audit trail.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card title="Officer Decision">
        <Loading message="Loading decision details..." />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link
            className="mb-2 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
            to={`/bids/${id}/verification`}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to verification results
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Procurement Officer Decision</h1>
          <p className="text-sm text-slate-500">
            Bid ID: <span className="font-mono">{id}</span> ·{' '}
            {bid?.bidder?.legal_name || 'Bidder'}
          </p>
        </div>
        <Link to={`/bids/${id}/audit`}>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            <span>Audit Trail</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <Card
        title="Official Procurement Action"
        subtitle="The human Procurement Officer owns the final determination. AI recommendations are purely advisory."
      >
        {decision ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-lg">
                <ClipboardCheck className="h-6 w-6 text-emerald-600" />
                <span>Final Decision: {decision.action.replace(/_/g, ' ')}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPending(decision.action)}
              >
                Change Decision
              </Button>
            </div>
            <p className="mt-2 text-sm text-emerald-800">
              Recorded by <strong>{decision.actor}</strong> on{' '}
              {new Date(decision.recorded_at).toLocaleString()}
            </p>
            {decision.note && (
              <div className="mt-3 rounded bg-white/80 p-3 border border-emerald-100 text-sm text-slate-800">
                <span className="font-semibold text-emerald-900 block mb-1">Remarks & Justification:</span>
                <p>{decision.note}</p>
              </div>
            )}
            {decision.compliance_score_at_decision !== undefined && (
              <p className="mt-3 text-xs text-emerald-700">
                Compliance score at decision: <strong>{decision.compliance_score_at_decision}%</strong> · Risk Level:{' '}
                <strong>{decision.risk_level_at_decision || 'N/A'}</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              No formal officer verdict has been finalized for this bid. Select an action below:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => setPending('APPROVE')}>
                Approve (Qualify)
              </Button>
              <Button variant="danger" onClick={() => setPending('REJECT')}>
                Reject (Disqualify)
              </Button>
              <Button variant="outline" onClick={() => setPending('REQUEST_CLARIFICATION')}>
                Request Clarification
              </Button>
            </div>
          </div>
        )}

        {pending && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-800">
              Confirm Action: <span className="text-indigo-600">{pending.replace(/_/g, ' ')}</span>
            </p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Enter optional administrative remarks, reasons, or conditions..."
              className="mt-3 min-h-24 w-full rounded border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={() => void confirm()} isLoading={submitting}>
                Save Decision & Emit Audit Event
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BidDecisionPage;
