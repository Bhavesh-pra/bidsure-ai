import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ClipboardCheck, Clock3, FileSearch } from 'lucide-react';
import { officerDecisionStore } from '../services/officerDecisionStore';

export const BidAuditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const decision = id ? officerDecisionStore.get(id) : null;
  return <div className="space-y-5"><Card title={`Bid ${id ?? ''} — Audit`} subtitle="Chronological activity and officer actions"><div className="space-y-4"><div className="flex gap-3"><FileSearch className="mt-0.5 h-5 w-5 text-indigo-600" /><div><p className="font-medium text-slate-800">Verification results viewed</p><p className="text-sm text-slate-500">Backend verification output is available for officer review.</p></div></div>{decision && <div className="flex gap-3"><ClipboardCheck className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="font-medium text-slate-800">Officer decision: {decision.action.replace(/_/g, ' ')}</p><p className="text-sm text-slate-500">{decision.actor} · {new Date(decision.recorded_at).toLocaleString()}</p>{decision.note && <p className="mt-1 text-sm text-slate-600">{decision.note}</p>}</div></div>}{!decision && <div className="flex gap-3"><Clock3 className="mt-0.5 h-5 w-5 text-slate-400" /><p className="text-sm text-slate-500">No officer decision recorded yet.</p></div>}</div></Card><Link className="text-sm text-indigo-600 hover:underline" to={`/bids/${id}/verification`}>Back to verification results</Link></div>;
};

export default BidAuditPage;
