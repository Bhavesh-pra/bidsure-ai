import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ClipboardCheck, Clock3, FileSearch, ArrowLeft, History } from 'lucide-react';
import { officerDecisionStore } from '../services/officerDecisionStore';

export const BidAuditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const decision = id ? officerDecisionStore.get(id) : null;

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
            <span className="font-mono text-[#0F2747] font-semibold">Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-1">
            System & Officer Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bid ID: <span className="font-mono">{id}</span> · Tamper-evident chronological audit history.
          </p>
        </div>

        <Link to={`/bids/${id}/verification`}>
          <Button variant="outline" size="sm">
            View Verification Results
          </Button>
        </Link>
      </div>

      <Card title="Activity Timeline & Event Trail" subtitle="Complete record of document OCR, rule verification, and officer decisions">
        <div className="space-y-6 py-2">
          <div className="flex items-start space-x-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] shrink-0 border border-[#BFDBFE]">
              <FileSearch className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">Verification Engine Execution</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic rule evaluation completed. Findings and cross-verification status logged to audit registry.
              </p>
            </div>
          </div>

          {decision ? (
            <div className="flex items-start space-x-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF3] text-[#15803D] shrink-0 border border-[#A7F3D0]">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#15803D]">
                  Officer Binding Decision: {decision.action.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Recorded by <strong>{decision.actor}</strong> on {new Date(decision.recorded_at).toLocaleString('en-IN')}.
                </p>
                {decision.note && (
                  <p className="mt-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                    "{decision.note}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 shrink-0 border border-slate-200">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-slate-600">Pending Officer Action</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  No final binding decision has been recorded by the Procurement Officer yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BidAuditPage;
