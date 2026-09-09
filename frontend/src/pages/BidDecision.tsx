import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { officerDecisionStore, type OfficerDecision, type OfficerDecisionAction } from '../services/officerDecisionStore';
import { ArrowLeft, UserCheck, ClipboardCheck, ShieldCheck } from 'lucide-react';

export const BidDecisionPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [decision, setDecision] = React.useState<OfficerDecision | null>(() => (id ? officerDecisionStore.get(id) : null));
  const [pending, setPending] = React.useState<OfficerDecisionAction | null>(null);
  const [note, setNote] = React.useState('');

  const confirm = () => {
    if (!id || !pending) return;
    const saved = officerDecisionStore.save({
      bid_id: id,
      action: pending,
      note: note.trim() || undefined,
      actor: 'Procurement Officer',
      recorded_at: new Date().toISOString(),
    });
    setDecision(saved);
    setPending(null);
    setNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link to={`/bids/${id}/verification`} className="hover:text-slate-800 flex items-center transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Verification
            </Link>
            <span>/</span>
            <span className="font-mono text-[#0F2747] font-semibold">Officer Decision</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-1">
            Procurement Officer Decision Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bid ID: <span className="font-mono">{id}</span> · Final decision authority rests with the Procurement Officer.
          </p>
        </div>

        <Link to={`/bids/${id}/verification`}>
          <Button variant="outline" size="sm">
            View Verification Results
          </Button>
        </Link>
      </div>

      <Card
        title="Binding Officer Decision"
        subtitle="The AI system provides advisory recommendations. The Procurement Officer must record the final decision."
      >
        {decision ? (
          <div className="rounded-[6px] border border-[#A7F3D0] bg-[#ECFDF3] p-4 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm text-[#15803D]">
              <ClipboardCheck className="h-5 w-5" />
              <span>Final Officer Decision: {decision.action.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-xs text-[#15803D]">
              Recorded by <strong>{decision.actor}</strong> on {new Date(decision.recorded_at).toLocaleString('en-IN')}
            </p>
            {decision.note && (
              <p className="text-xs text-slate-700 bg-white p-3 rounded-[6px] border border-emerald-200 mt-2 font-medium">
                Rationale: "{decision.note}"
              </p>
            )}
            <div className="pt-3">
              <Button variant="outline" size="sm" onClick={() => setPending(decision.action)}>
                Record New Decision
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600">
              No binding decision has been recorded for this bid. Select an outcome to proceed:
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="secondary" onClick={() => setPending('APPROVE')}>
                Approve Bid
              </Button>
              <Button variant="danger" onClick={() => setPending('REJECT')}>
                Reject Bid
              </Button>
              <Button variant="outline" onClick={() => setPending('REQUEST_CLARIFICATION')}>
                Request Clarification
              </Button>
            </div>
          </div>
        )}

        {pending && (
          <div className="mt-5 rounded-[8px] border border-[#0F2747] bg-[#0F2747] p-5 text-white shadow-lg space-y-3">
            <div className="flex items-center space-x-2 text-[#14B8A6]">
              <UserCheck className="h-5 w-5" />
              <h4 className="font-bold text-sm">Confirm Final Officer Decision</h4>
            </div>
            <p className="text-xs text-slate-200">
              Action: <strong className="text-white uppercase font-mono">{pending.replace(/_/g, ' ')}</strong> · Officer: <strong>Procurement Officer (L3)</strong>
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Required Decision Note / Rationale
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Enter mandatory decision comments or audit rationale..."
                className="w-full rounded-[6px] border border-slate-700 bg-[#183B63] p-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#14B8A6] min-h-[70px]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={confirm}>
                Confirm Decision
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={() => setPending(null)}>
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
