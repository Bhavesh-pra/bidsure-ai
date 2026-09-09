import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import {
  officerDecisionStore,
  type AuditEventItem,
} from '../services/officerDecisionStore';
import {
  ClipboardCheck,
  Clock3,
  FileSearch,
  ArrowLeft,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export const BidAuditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const decision = id ? officerDecisionStore.get(id) : null;

  useEffect(() => {
    if (!id) return;
    void officerDecisionStore
      .fetchAudit(id)
      .then((data) => setEvents(data || []))
      .catch(() => setEvents([]));
  }, [id]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Tenders', href: '/tenders' },
          { label: `Bid #${id}`, href: `/bids/${id}` },
          { label: 'Audit Trail' },
        ]}
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[#0F766E] uppercase tracking-wider text-[10px] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Immutable Log
            </span>
            <span>·</span>
            <span className="font-mono text-[#0F2747] font-semibold">Bid #{id}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">
            Case Activity & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological log of document ingestion, OCR rule evaluation, and officer decisions.
          </p>
        </div>

        <Link to={`/bids/${id}/verification`}>
          <Button variant="outline" size="sm" className="flex items-center space-x-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Verification Report</span>
          </Button>
        </Link>
      </div>

      {/* Main Audit Card */}
      <Card
        title="Chronological Audit Timeline"
        subtitle="System processing events and statutory officer actions"
      >
        <div className="space-y-6 pt-2">
          {events.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-6">
              {events.map((ev) => (
                <div key={ev.id} className="relative">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F2747] text-white border-2 border-white text-xs">
                    <Activity className="h-3 w-3" />
                  </div>

                  <div className="rounded-[6px] border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0F2747]">
                        {ev.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN') : 'Recent'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Executed by: <strong>{ev.user_name}</strong>
                    </p>

                    {ev.remarks && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 font-medium italic mt-2">
                        &quot;{ev.remarks}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 rounded-[6px] border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
                <FileSearch className="h-4 w-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0F2747]">Verification Pipeline Executed</p>
                  <p className="text-slate-500 mt-0.5">
                    Cross-document checks and cross-verification against GSTIN / PAN registries generated.
                  </p>
                </div>
              </div>

              {decision ? (
                <div className="flex items-start space-x-3 rounded-[6px] border border-[#A7F3D0] bg-[#ECFDF3] p-3.5 text-xs">
                  <ClipboardCheck className="h-4 w-4 text-[#15803D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#15803D]">
                      Binding Officer Decision: {decision.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Recorded by <strong>{decision.actor}</strong> on{' '}
                      {new Date(decision.recorded_at).toLocaleString('en-IN')}.
                    </p>
                    {decision.note && (
                      <p className="text-slate-700 font-medium italic mt-1 bg-white p-2 rounded border border-emerald-200">
                        Note: &quot;{decision.note}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 rounded-[6px] border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500">
                  <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>No binding officer decision recorded yet for this bid.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BidAuditPage;
