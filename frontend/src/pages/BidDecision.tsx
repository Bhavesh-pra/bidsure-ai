import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import {
  officerDecisionStore,
  type OfficerDecision,
  type OfficerDecisionAction,
} from '../services/officerDecisionStore';
import {
  ClipboardCheck,
  UserCheck,
  ArrowLeft,
  Bot,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export const BidDecisionPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [decision, setDecision] = React.useState<OfficerDecision | null>(() =>
    id ? officerDecisionStore.get(id) : null
  );
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
      <Breadcrumbs
        items={[
          { label: 'Tenders', href: '/tenders' },
          { label: `Bid #${id}`, href: `/bids/${id}` },
          { label: 'Officer Decision' },
        ]}
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[#0F766E] uppercase tracking-wider text-[10px] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Statutory Authority
            </span>
            <span>·</span>
            <span className="font-mono text-[#0F2747] font-semibold">Bid #{id}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">
            Procurement Officer Binding Decision
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record binding determination for bid compliance evaluation. AI findings are purely advisory.
          </p>
        </div>

        <Link to={`/bids/${id}/verification`}>
          <Button variant="outline" size="sm" className="flex items-center space-x-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Verification Report</span>
          </Button>
        </Link>
      </div>

      {/* AI Advisory Notice Banner */}
      <div className="rounded-[8px] border border-teal-200 bg-[#F0FDFA] p-4 flex items-start space-x-3 text-xs text-[#0F2747]">
        <Bot className="h-5 w-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-[#0F2747]">Human-in-the-Loop Decision Model</h4>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            All AI-extracted evidence and automated rule checks are advisory. The Procurement Officer retains exclusive statutory authority over final bid approval or rejection.
          </p>
        </div>
      </div>

      {/* Main Decision Card */}
      <Card
        title="Binding Determination Record"
        subtitle="Final signed decision registered to audit log"
      >
        {decision ? (
          <div className="rounded-[6px] border border-[#A7F3D0] bg-[#ECFDF3] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-[#15803D]">
                <ClipboardCheck className="h-5 w-5" />
                <span>Final Decision: {decision.action.replace(/_/g, ' ')}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPending(decision.action)}
                className="text-xs"
              >
                Record New Decision
              </Button>
            </div>
            <p className="text-xs text-[#15803D]">
              Signed by <strong>{decision.actor}</strong> on{' '}
              {new Date(decision.recorded_at).toLocaleString('en-IN')}
            </p>
            {decision.note && (
              <p className="text-xs text-slate-700 bg-white p-3 rounded border border-emerald-200 font-medium">
                Note: &quot;{decision.note}&quot;
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              No final officer decision has been recorded for this bid yet. Select an action below:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setPending('APPROVE')}>
                Approve Bid Proposal
              </Button>
              <Button variant="danger" onClick={() => setPending('REJECT')}>
                Reject Bid Proposal
              </Button>
              <Button variant="outline" onClick={() => setPending('REQUEST_CLARIFICATION')}>
                Request Vendor Clarification
              </Button>
            </div>
          </div>
        )}

        {/* Action Confirmation Box */}
        {pending && (
          <div className="mt-5 rounded-[8px] border border-[#0F2747] bg-[#0F2747] p-5 text-white shadow-md space-y-3">
            <div className="flex items-center space-x-2 text-[#14B8A6]">
              <UserCheck className="h-5 w-5" />
              <h4 className="font-bold text-sm">Confirm Decision: {pending.replace(/_/g, ' ')}</h4>
            </div>
            <p className="text-xs text-slate-200">
              Authority Level: <strong>Procurement Officer (L3)</strong> · Case Ref: <span className="font-mono">{id}</span>
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Required Decision Rationale / Audit Notes
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Enter mandatory decision comments or clarification requests..."
                className="w-full rounded-[6px] border border-slate-700 bg-[#183B63] p-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#14B8A6] min-h-[80px]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={confirm}>
                Sign & Save Final Decision
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
                onClick={() => setPending(null)}
              >
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
