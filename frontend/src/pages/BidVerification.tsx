import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  XCircle,
  ClipboardCheck,
  ShieldAlert,
  Clock3,
  FileCheck,
  History,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { EvidenceFieldCard } from '../components/documents';
import { bidService } from '../services/bidService';
import { evidenceService } from '../services/evidenceService';
import {
  verificationService,
  type RequirementResultStatus,
  type VerificationResult,
} from '../services/verificationService';
import type { Bid, Evidence } from '../types';
import {
  officerDecisionStore,
  type OfficerDecision,
  type OfficerDecisionAction,
  type AuditEventItem,
} from '../services/officerDecisionStore';

const statusStyles: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  PASS: {
    label: 'PASS',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  VERIFIED: {
    label: 'VERIFIED',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  FAIL: {
    label: 'FAIL',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <XCircle className="h-4 w-4" />,
  },
  REVIEW: {
    label: 'REVIEW',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <CircleAlert className="h-4 w-4" />,
  },
  UNKNOWN: {
    label: 'UNKNOWN',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: <CircleHelp className="h-4 w-4" />,
  },
};

const StatusBadge: React.FC<{ status: RequirementResultStatus | string }> = ({ status }) => {
  const item = statusStyles[status] || statusStyles.UNKNOWN;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
};

export const BidVerificationPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [bid, setBid] = React.useState<Bid | null>(null);
  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [evidence, setEvidence] = React.useState<Evidence[]>([]);
  const [auditEvents, setAuditEvents] = React.useState<AuditEventItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState('');
  const [decision, setDecision] = React.useState<OfficerDecision | null>(null);
  const [pendingDecision, setPendingDecision] = React.useState<OfficerDecisionAction | null>(null);
  const [decisionNote, setDecisionNote] = React.useState('');

  React.useEffect(() => {
    if (!id) {
      setError('No bid ID provided.');
      setLoading(false);
      return;
    }

    // Pre-populate with local cache if available
    setDecision(officerDecisionStore.get(id));

    void Promise.all([
      bidService.get(id),
      evidenceService.listForBid(id),
      officerDecisionStore.fetchDecision(id).catch(() => null),
      verificationService.getVerification(id).catch(() => null),
      officerDecisionStore.fetchAudit(id).catch(() => []),
    ])
      .then(([bidResponse, evidenceResponse, fetchedDecision, existingVerification, fetchedAudit]) => {
        setBid(bidResponse.data);
        setEvidence(evidenceResponse.data.evidence || []);
        if (fetchedDecision) setDecision(fetchedDecision);
        if (existingVerification?.data) setResult(existingVerification.data);
        if (fetchedAudit && Array.isArray(fetchedAudit)) setAuditEvents(fetchedAudit);
      })
      .catch((err: any) => setError(err?.message || 'Unable to load bid verification.'))
      .finally(() => setLoading(false));
  }, [id]);

  const runVerification = async () => {
    if (!id) return;
    setRunning(true);
    setError('');
    try {
      const response = await verificationService.verifyBid(id);
      setResult(response.data);
      const refreshedAudit = await officerDecisionStore.fetchAudit(id);
      setAuditEvents(refreshedAudit);
    } catch (err: any) {
      setError(err?.message || 'Verification could not be completed.');
    } finally {
      setRunning(false);
    }
  };

  const confirmDecision = async () => {
    if (!id || !pendingDecision) return;
    try {
      const next = await officerDecisionStore.submitDecision(
        id,
        pendingDecision,
        decisionNote.trim() || undefined
      );
      setDecision(next);
      setPendingDecision(null);
      setDecisionNote('');
      const refreshedAudit = await officerDecisionStore.fetchAudit(id);
      setAuditEvents(refreshedAudit);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit officer decision.');
    }
  };

  if (loading) {
    return (
      <Card title="Verification">
        <Loading message="Loading bid verification..." />
      </Card>
    );
  }

  if (error && !bid) {
    return (
      <Card title="Verification">
        <ErrorState title="Unable to load verification" message={error} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to={`/bids/${id}`}
            className="mb-2 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to bid
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Bid Verification</h1>
          <p className="text-sm text-slate-500">
            {bid?.bidder?.legal_name || result?.bidder?.legal_name || result?.bidder?.name || 'Bidder'} · {bid?.id || id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/bids/${id}/audit`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              <span>Audit Trail</span>
            </Button>
          </Link>
          <Button onClick={() => void runVerification()} isLoading={running}>
            {result ? 'Run Verification Again' : 'Run Verification'}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Verification Pipeline Step Tracker */}
      <Card
        title="Verification pipeline"
        subtitle="End-to-end evaluation: Documents → OCR → Evidence → Cross Verification → Deterministic Rules → Score & Risk"
      >
        <div className="grid gap-2 text-center text-xs font-medium text-slate-700 sm:grid-cols-5">
          <div className="rounded border bg-slate-50 p-3">
            <span className="block font-semibold text-slate-900 mb-1">1. Documents</span>
            Uploaded PDFs
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <span className="block font-semibold text-slate-900 mb-1">2. OCR & Text</span>
            Text Extraction
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <span className="block font-semibold text-slate-900 mb-1">3. Evidence</span>
            Entities Extracted
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <span className="block font-semibold text-slate-900 mb-1">4. Cross-Checks</span>
            Identity & Contradictions
          </div>
          <div className="rounded border bg-slate-50 p-3">
            <span className="block font-semibold text-slate-900 mb-1">5. Compliance</span>
            Deterministic Score
          </div>
        </div>
      </Card>

      {!result ? (
        <Card title="Ready to verify">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileCheck className="h-12 w-12 text-indigo-500 mb-3" />
            <p className="font-medium text-slate-800">No verification results computed yet</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Click &quot;Run Verification&quot; to execute OCR checks, mock registry verification (GSTN, PAN, Udyam), cross-document matching, and deterministic scoring.
            </p>
            <div className="mt-4">
              <Button onClick={() => void runVerification()} isLoading={running}>
                Run Verification Now
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary Scorecards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Compliance score">
              <p className="text-4xl font-bold text-slate-900">
                {result.compliance_score ?? '—'}
                <span className="text-lg text-slate-500">%</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Deterministic rule evaluation (Gemini is not used for numerical scoring)
              </p>
            </Card>
            <Card title="Risk level">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                    result.risk_level === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800'
                      : result.risk_level === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result.risk_level || '—'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Computed from contradictory evidence and rule failures
              </p>
            </Card>
            <Card title="Requirements">
              <p className="text-2xl font-bold text-slate-900">
                {result.requirements_passed ?? '—'}{' '}
                <span className="text-base font-normal text-slate-500">
                  / {result.requirements_total ?? result.requirements.length}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Tender criteria evaluated</p>
            </Card>
          </div>

          {/* Requirement Checklist */}
          <Card
            title="Requirement checklist"
            subtitle="Each result links back to its source evidence and page provenance."
          >
            <div className="divide-y divide-slate-100">
              {result.requirements.map((requirement, index) => (
                <div
                  key={requirement.id || `${requirement.name}-${index}`}
                  className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{requirement.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {requirement.reason || 'No explanation provided.'}
                    </p>
                    {requirement.evidence && (
                      <p className="mt-2 text-xs text-slate-500">
                        Evidence:{' '}
                        <span className="font-mono font-medium text-slate-700">
                          {requirement.evidence.document || requirement.evidence.document_id || 'Document'}
                        </span>{' '}
                        · Page {requirement.evidence.page ?? '1'} ·{' '}
                        {requirement.evidence.field || 'field'}:{' '}
                        <span className="font-semibold text-slate-800">
                          {String(requirement.evidence.value ?? '—')}
                        </span>
                      </p>
                    )}
                  </div>
                  <StatusBadge status={requirement.status} />
                </div>
              ))}
            </div>
          </Card>

          {/* Extracted Evidence */}
          <Card
            title="Evidence traceability"
            subtitle="Document → Page → Field → Value → Confidence"
          >
            {evidence.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {evidence.map((item) => (
                  <EvidenceFieldCard key={item.id} evidence={item} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No individual evidence items persisted yet. Verification evaluates documents dynamically.
              </p>
            )}
          </Card>

          {/* Cross Verification */}
          <Card
            title="Cross-Document Verification"
            subtitle="Consistency check between declared bidder metadata, OCR document extractions, and mock government records."
          >
            <div className="divide-y divide-slate-100">
              {result.cross_verification.map((item) => (
                <div
                  key={item.field}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.field.replace(/_/g, ' ')}
                    </p>
                    {item.reason && (
                      <p className="text-sm text-slate-500">{item.reason}</p>
                    )}
                  </div>
                  <StatusBadge
                    status={
                      item.status === 'MATCH'
                        ? 'PASS'
                        : item.status === 'MISMATCH'
                        ? 'FAIL'
                        : item.status === 'REVIEW'
                        ? 'REVIEW'
                        : 'UNKNOWN'
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* AI Recommendation */}
          <Card
            title="Advisory AI recommendation"
            subtitle="Generated strictly from deterministic compliance rules and cross-document verification findings."
          >
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-indigo-700">
                  Recommended Action:
                </span>
                <span className="font-bold text-slate-900">
                  {result.recommendation?.status || '—'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {result.recommendation?.summary || 'No recommendation summary returned.'}
              </p>
              {result.recommendation?.reasons?.length ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Justification:
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {result.recommendation.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Important Findings */}
          <Card
            title="Important findings & discrepancies"
            subtitle="Anomalies detected across registry checks, threshold calculations, and cross-checks."
          >
            <div className="space-y-2">
              {(() => {
                const findings: string[] = [
                  ...(result.risk_factors || []),
                  ...result.requirements
                    .filter((item) => item.status !== 'PASS' && item.status !== 'VERIFIED')
                    .map((item) => `${item.name}: ${item.reason || item.status}`),
                  ...result.cross_verification
                    .filter((item) => item.status !== 'MATCH')
                    .map((item) => `${item.field}: ${item.reason || item.status}`),
                ];

                if (!findings.length) {
                  return (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>All statutory, financial, and technical checks passed without discrepancy.</span>
                    </div>
                  );
                }

                return findings.map((finding) => (
                  <p
                    key={finding}
                    className="flex items-start gap-2 rounded bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200"
                  >
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span>{finding}</span>
                  </p>
                ));
              })()}
            </div>
          </Card>

          {/* Procurement Officer Decision */}
          <Card
            title="Procurement officer decision"
            subtitle="The AI recommendation is advisory. The human Procurement Officer retains full final authority."
          >
            {decision ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800">
                    <ClipboardCheck className="h-5 w-5" />
                    Final decision: {decision.action.replace(/_/g, ' ')}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingDecision(decision.action)}
                  >
                    Change Decision
                  </Button>
                </div>
                <p className="mt-2 text-sm text-emerald-700">
                  Recorded by <strong>{decision.actor}</strong> on{' '}
                  {new Date(decision.recorded_at).toLocaleString()}
                </p>
                {decision.note && (
                  <p className="mt-2 text-sm text-emerald-800 bg-emerald-100/60 p-2 rounded">
                    <strong>Note / Remarks:</strong> {decision.note}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  No final officer decision has been recorded yet. Select an action below to record your formal verdict into the audit log:
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={() => setPendingDecision('APPROVE')}>
                    Approve / Qualify Bid
                  </Button>
                  <Button variant="danger" onClick={() => setPendingDecision('REJECT')}>
                    Disqualify Bid
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPendingDecision('REQUEST_CLARIFICATION')}
                  >
                    Request Clarification
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Decision Confirmation Modal */}
          {pendingDecision && (
            <Card
              title="Confirm officer decision"
              subtitle="This action records your formal administrative verdict in the immutable audit log."
            >
              <p className="text-sm text-slate-700">
                Action to record:{' '}
                <span className="font-bold text-indigo-700">
                  {pendingDecision.replace(/_/g, ' ')}
                </span>
              </p>
              <textarea
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                placeholder="Enter justification remarks, compliance notes, or conditions..."
                className="mt-3 min-h-24 w-full rounded border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void confirmDecision()}>Confirm & Save to Audit Log</Button>
                <Button variant="ghost" onClick={() => setPendingDecision(null)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Audit Timeline */}
          <Card
            title="Audit timeline"
            subtitle="Immutable activity and verification records."
            action={
              <Link to={`/bids/${id}/audit`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <span>Full Trail</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            }
          >
            <div className="space-y-3 text-sm text-slate-600">
              {auditEvents.length > 0 ? (
                auditEvents.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2 border-b border-slate-100 pb-2">
                    <Clock3 className="mt-0.5 h-4 w-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-800">{ev.action.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-400 block">
                        {ev.user_name} · {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}
                      </span>
                      {ev.remarks && <p className="mt-1 text-xs text-slate-600 italic">&quot;{ev.remarks}&quot;</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
                  <span>Verification completed. Ready to record officer decision.</span>
                </div>
              )}
              {decision && (
                <div className="flex items-start gap-2 bg-emerald-50/50 p-2 rounded">
                  <ClipboardCheck className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{decision.action.replace(/_/g, ' ')}</strong> recorded by {decision.actor} at{' '}
                    {new Date(decision.recorded_at).toLocaleString()}.
                  </span>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default BidVerificationPage;
