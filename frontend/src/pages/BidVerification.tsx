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
  Sparkles,
  Bot,
  UserCheck,
  FileText,
  Layers,
  History,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Tooltip } from '../components/ui/Tooltip';
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

const statusStyles: Record<RequirementResultStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PASS: {
    label: 'VERIFIED PASS',
    className: 'bg-[#ECFDF3] text-[#15803D] border-[#A7F3D0]',
    icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  },
  VERIFIED: {
    label: 'VERIFIED PASS',
    className: 'bg-[#ECFDF3] text-[#15803D] border-[#A7F3D0]',
    icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  },
  FAIL: {
    label: 'CRITICAL FAIL',
    className: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
    icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
  },
  REVIEW: {
    label: 'REVIEW REQUIRED',
    className: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    icon: <CircleAlert className="h-3.5 w-3.5 shrink-0" />,
  },
  UNKNOWN: {
    label: 'UNABLE TO VERIFY',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <CircleHelp className="h-3.5 w-3.5 shrink-0" />,
  },
};

const StatusBadge: React.FC<{ status: RequirementResultStatus | string }> = ({ status }) => {
  const item = statusStyles[status as RequirementResultStatus] || statusStyles.UNKNOWN;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-xs font-bold tracking-wide ${item.className}`}
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
      <Card title="Compliance Assessment">
        <Loading message="Loading bid verification pipeline..." />
      </Card>
    );
  }

  if (error && !bid) {
    return (
      <Card title="Compliance Assessment">
        <ErrorState title="Unable to load verification" message={error} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Tenders', href: '/tenders' },
          { label: `Bid #${id}`, href: `/bids/${id}` },
          { label: 'Compliance Verification' },
        ]}
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-[#0F766E] uppercase tracking-wider text-[10px] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Verification Engine
            </span>
            <span>·</span>
            <span className="font-mono text-[#0F2747] font-semibold">Deterministic Rule Evaluation</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">
            Compliance Assessment Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {bid?.bidder?.legal_name || result?.bidder?.legal_name || result?.bidder?.name || 'Bidder'} · Case Ref:{' '}
            <span className="font-mono">{bid?.id || id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/bids/${id}/audit`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <History className="h-3.5 w-3.5 text-slate-500" />
              <span>Audit Trail</span>
            </Button>
          </Link>
          <Button
            onClick={() => void runVerification()}
            isLoading={running}
            variant={result ? 'outline' : 'primary'}
            size="sm"
            className="flex items-center space-x-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#14B8A6]" />
            <span>{result ? 'Re-run Verification Pipeline' : 'Run Verification Pipeline'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-[6px] border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Visual Pipeline Chain Indicator with Tooltips */}
      <Card
        title="BidSure Traceable Evidence Workflow"
        subtitle="Deterministic chain: Requirement → Evidence → Extraction → Rule → Decision"
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-semibold">
          <Tooltip content="Rule derived deterministically from published Tender PDF specification">
            <div className="rounded-[6px] border border-slate-200 bg-slate-50 p-3 text-slate-700 cursor-help hover:bg-slate-100 transition-colors">
              1. Tender Requirement
            </div>
          </Tooltip>
          
          <Tooltip content="Document OCR page text extracted & hashed with SHA-256">
            <div className="rounded-[6px] border border-slate-200 bg-slate-50 p-3 text-slate-700 cursor-help hover:bg-slate-100 transition-colors">
              2. Document OCR
            </div>
          </Tooltip>

          <Tooltip content="Key-value pairs extracted with page & bounding-box provenance">
            <div className="rounded-[6px] border border-slate-200 bg-slate-50 p-3 text-slate-700 cursor-help hover:bg-slate-100 transition-colors">
              3. Extracted Field
            </div>
          </Tooltip>

          <Tooltip content="Matched against statutory GSTIN / PAN / Govt verification registries">
            <div className="rounded-[6px] border border-[#BFDBFE] bg-[#EFF6FF] p-3 text-[#2563EB] cursor-help hover:bg-blue-100 transition-colors">
              4. Verification Source
            </div>
          </Tooltip>

          <Tooltip content="Final binding determination signed by statutory Procurement Officer">
            <div className="rounded-[6px] border border-[#A7F3D0] bg-[#ECFDF3] p-3 text-[#15803D] cursor-help hover:bg-emerald-100 transition-colors">
              5. Officer Decision
            </div>
          </Tooltip>
        </div>
      </Card>

      {!result ? (
        <Card title="Ready for Verification Evaluation">
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Run Deterministic Verification</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Execute cross-document checks, compare extracted GSTIN/PAN with government databases, and evaluate compliance rules.
            </p>
            <Button variant="primary" onClick={() => void runVerification()} isLoading={running}>
              Execute Verification Pipeline
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Hero KPI Summary Section */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Compliance Score */}
            <Tooltip content="Score generated via deterministic rule checking: mandatory 100%, turnover 80-100%, OEM status 75-100%">
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] flex items-center justify-between cursor-help hover:border-slate-300 transition-colors">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Compliance Score
                  </span>
                  <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-4xl font-extrabold text-[#0F2747]">
                      {result.compliance_score ?? '—'}
                    </span>
                    <span className="text-lg font-bold text-slate-500">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Deterministic rule evaluation</p>
                </div>

                {/* Circular Meter Graphic */}
                <div
                  className={`h-16 w-16 rounded-full border-4 flex items-center justify-center font-bold text-xs ${
                    (result.compliance_score ?? 0) >= 75
                      ? 'border-[#15803D] bg-[#ECFDF3] text-[#15803D]'
                      : (result.compliance_score ?? 0) >= 50
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                  }`}
                >
                  {result.compliance_score ?? 0}%
                </div>
              </div>
            </Tooltip>

            {/* Risk Level */}
            <Tooltip content="Risk level classification based on cross-document consistency and mandatory requirement fulfillment">
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] cursor-help hover:border-slate-300 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Overall Risk Level
                </span>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      result.risk_level === 'HIGH'
                        ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
                        : result.risk_level === 'MEDIUM'
                        ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                        : 'bg-[#ECFDF3] text-[#15803D] border border-[#A7F3D0]'
                    }`}
                  >
                    {result.risk_level || 'LOW RISK'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Based on mandatory requirement checks</p>
              </div>
            </Tooltip>

            {/* Requirements Passed Counter */}
            <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Requirements Verified
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-3xl font-extrabold text-[#0F2747]">
                  {result.requirements_passed ?? 0}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  / {result.requirements_total ?? result.requirements.length}
                </span>
              </div>
              <p className="text-[11px] text-[#15803D] font-medium mt-1">
                {result.requirements.filter((r) => r.status === 'PASS' || r.status === 'VERIFIED').length} Verified ·{' '}
                {result.requirements.filter((r) => r.status === 'REVIEW').length} Pending Review
              </p>
            </div>
          </div>

          {/* Requirement-by-Requirement Traceability List */}
          <Card
            title="Requirement Compliance Checklist"
            subtitle="Each result links directly to source document, page number, and extracted field value"
          >
            <div className="divide-y divide-slate-100">
              {result.requirements.map((requirement, index) => (
                <div
                  key={requirement.id || `${requirement.name}-${index}`}
                  className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-[#0F2747]">{requirement.name}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {requirement.reason || 'Requirement verified against extracted bidder document.'}
                    </p>
                    {requirement.evidence && (
                      <div className="mt-2 inline-flex items-center space-x-2 rounded-[4px] bg-slate-50 border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Document:{' '}
                          <strong className="text-slate-800">
                            {requirement.evidence.document || requirement.evidence.document_id || 'PDF Document'}
                          </strong>
                        </span>
                        <span>· Page {requirement.evidence.page ?? '1'}</span>
                        <span>
                          · Field:{' '}
                          <strong className="font-mono text-[#0F766E]">
                            {requirement.evidence.field || 'value'}
                          </strong>
                          : {String(requirement.evidence.value ?? '—')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    <StatusBadge status={requirement.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Extracted Structured Evidence Fields */}
          <Card
            title="Structured Evidence Fields"
            subtitle="Field → Value → Confidence Score → Page Provenance"
          >
            {evidence.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {evidence.map((item) => (
                  <EvidenceFieldCard key={item.id} evidence={item} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">No structured evidence records available.</p>
            )}
          </Card>

          {/* Cross-Verification Checks */}
          <Card
            title="Cross-Document Verification Checks"
            subtitle="Verification between GSTIN, PAN, and Tender Organization data"
          >
            <div className="divide-y divide-slate-100">
              {result.cross_verification.map((item) => (
                <div key={item.field} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold text-xs text-slate-900">{item.field.replace(/_/g, ' ')}</p>
                    {item.reason && <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>}
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

          {/* Key Audit Findings */}
          <Card
            title="Key Audit Findings"
            subtitle="Items requiring special officer attention prior to final decision"
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
                    <p className="text-xs text-[#15803D] bg-[#ECFDF3] border border-[#A7F3D0] p-3 rounded-[6px] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                      <span>All statutory, financial, and technical requirements passed without critical risk flags.</span>
                    </p>
                  );
                }

                return findings.map((finding, idx) => (
                  <div
                    key={`${finding}-${idx}`}
                    className="flex items-start gap-2.5 rounded-[6px] border border-[#FDE68A] bg-[#FFFBEB] p-3 text-xs text-[#B45309]"
                  >
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" />
                    <span className="font-medium">{finding}</span>
                  </div>
                ));
              })()}
            </div>
          </Card>

          {/* AI-Assisted Recommendation Card (Advisory) */}
          <div className="rounded-[8px] border border-teal-200 bg-[#F0FDFA] p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#0F766E]">
                <Bot className="h-5 w-5" />
                <h3 className="font-bold text-sm text-[#0F2747]">AI-Assisted Recommendation</h3>
              </div>
              <div className="flex items-center space-x-2">
                {result.recommendation?.model_name && (
                  <span className="text-[10px] font-semibold text-slate-600 bg-white border border-teal-200 px-2 py-0.5 rounded-[4px]">
                    {result.recommendation.model_name}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-[#0F766E] border border-teal-300 px-2 py-0.5 rounded-[4px]">
                  Advisory Only
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[6px] border border-teal-100 p-3.5 space-y-2">
              <p className="font-bold text-xs text-[#0F2747]">
                Recommendation:{' '}
                <span className="text-[#0F766E]">
                  {result.recommendation?.status || 'REVIEW REQUIRED'}
                </span>
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {result.recommendation?.summary ||
                  'The recommendation is advisory. Review evidence traceability before making the final officer decision.'}
              </p>
              {result.recommendation?.reasons?.length ? (
                <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                  {result.recommendation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Important: AI recommendations are purely advisory and do not constitute an automated legal decision. The Procurement Officer retains complete statutory authority over the final decision.
            </p>
          </div>

          {/* Procurement Officer Decision Panel */}
          <Card
            title="Procurement Officer Binding Decision"
            subtitle="Review findings and evidence above before recording the final binding officer decision"
          >
            {decision ? (
              <div className="rounded-[6px] border border-[#A7F3D0] bg-[#ECFDF3] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm font-bold text-[#15803D]">
                    <ClipboardCheck className="h-5 w-5" />
                    <span>Final Decision: {decision.action.replace(/_/g, ' ')}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDecision(decision.action)}
                  >
                    Change Officer Decision
                  </Button>
                </div>
                <p className="text-xs text-[#15803D]">
                  Recorded by <strong>{decision.actor}</strong> on{' '}
                  {new Date(decision.recorded_at).toLocaleString('en-IN')}
                </p>
                {decision.note && (
                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-emerald-200 mt-2 font-medium">
                    Note: &quot;{decision.note}&quot;
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  No final decision has been recorded yet. Please select an action below to confirm:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="secondary" onClick={() => setPendingDecision('APPROVE')}>
                    Approve Bid
                  </Button>
                  <Button variant="danger" onClick={() => setPendingDecision('REJECT')}>
                    Reject Bid
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

          {/* Officer Decision Confirmation Dialog */}
          {pendingDecision && (
            <div className="rounded-[8px] border border-[#0F2747] bg-[#0F2747] p-5 text-white shadow-lg space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-[#14B8A6]">
                <UserCheck className="h-5 w-5" />
                <h4 className="font-bold text-sm">Confirm Procurement Officer Decision</h4>
              </div>
              <p className="text-xs text-slate-200">
                Action:{' '}
                <strong className="text-white uppercase font-mono">
                  {pendingDecision.replace(/_/g, ' ')}
                </strong>{' '}
                · Officer Authority: <strong>Procurement Officer (L3)</strong>
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Required Decision Rationale / Notes
                </label>
                <textarea
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value)}
                  placeholder="Enter detailed rationale, audit comments, or clarification details..."
                  className="w-full rounded-[6px] border border-slate-700 bg-[#183B63] p-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#14B8A6] min-h-[70px]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={() => void confirmDecision()}>
                  Sign & Save Final Decision
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                  onClick={() => setPendingDecision(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Audit Timeline */}
          <Card
            title="Activity Audit Trail"
            subtitle="Chronological timeline of system processing and officer events"
            action={
              <Link to={`/bids/${id}/audit`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                  <span>Full Trail</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            }
          >
            <div className="space-y-4 text-xs text-slate-600">
              {auditEvents.length > 0 ? (
                auditEvents.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-start space-x-3 border-b border-slate-100 pb-3">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                      <Clock3 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{ev.action.replace(/_/g, ' ')}</p>
                      <p className="text-slate-500 text-[11px]">
                        {ev.user_name} · {ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN') : 'Recent'}
                      </p>
                      {ev.remarks && (
                        <p className="text-slate-700 mt-1 italic">&quot;{ev.remarks}&quot;</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                    <Clock3 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Verification pipeline executed</p>
                    <p className="text-slate-500 text-[11px]">
                      Deterministic compliance score calculated from backend rules.
                    </p>
                  </div>
                </div>
              )}

              {decision && (
                <div className="flex items-start space-x-3">
                  <div className="h-6 w-6 rounded-full bg-[#ECFDF3] flex items-center justify-center text-[#15803D] shrink-0 mt-0.5">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Officer Decision Recorded</p>
                    <p className="text-slate-500 text-[11px]">
                      Action <strong className="text-slate-800">{decision.action.replace(/_/g, ' ')}</strong> recorded by {decision.actor} on{' '}
                      {new Date(decision.recorded_at).toLocaleString('en-IN')}.
                    </p>
                  </div>
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
