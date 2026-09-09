import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { officerDecisionStore, type OfficerDecision, type OfficerDecisionAction } from '../services/officerDecisionStore';

export const BidDecisionPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [decision, setDecision] = React.useState<OfficerDecision | null>(() => id ? officerDecisionStore.get(id) : null);
  const [pending, setPending] = React.useState<OfficerDecisionAction | null>(null);
  const [note, setNote] = React.useState('');
  const confirm = () => { if (!id || !pending) return; const saved = officerDecisionStore.save({ bid_id: id, action: pending, note: note.trim() || undefined, actor: 'Procurement Officer', recorded_at: new Date().toISOString() }); setDecision(saved); setPending(null); setNote(''); };
  return <div className="space-y-5"><Card title={`Bid ${id ?? ''} — Decision`} subtitle="The officer owns the final decision; AI recommendations are advisory.">{decision ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-800">Final decision: {decision.action.replace(/_/g, ' ')}</p><p className="mt-2 text-sm text-emerald-700">Recorded by {decision.actor} on {new Date(decision.recorded_at).toLocaleString()}</p>{decision.note && <p className="mt-2 text-sm text-emerald-700">Note: {decision.note}</p>}<div className="mt-4"><Button variant="outline" onClick={() => setPending(decision.action)}>Record a new decision</Button></div></div> : <div className="space-y-4"><p className="text-sm text-slate-600">No final decision has been recorded for this bid.</p><div className="flex flex-wrap gap-2"><Button onClick={() => setPending('APPROVE')}>Approve</Button><Button variant="danger" onClick={() => setPending('REJECT')}>Reject</Button><Button variant="outline" onClick={() => setPending('REQUEST_CLARIFICATION')}>Request Clarification</Button></div></div>}{pending && <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="font-medium text-slate-800">Confirm: {pending.replace(/_/g, ' ')}</p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional decision note" className="mt-3 min-h-20 w-full rounded border border-slate-300 p-3 text-sm" /><div className="mt-3 flex gap-2"><Button onClick={confirm}>Confirm Decision</Button><Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button></div></div>}</Card><Link className="text-sm text-indigo-600 hover:underline" to={`/bids/${id}/verification`}>Back to verification results</Link></div>;
};

export default BidDecisionPage;
