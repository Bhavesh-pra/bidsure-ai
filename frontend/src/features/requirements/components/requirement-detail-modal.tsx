import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  History,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Link as LinkIcon,
  Edit3,
  BookOpen,
  X,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RequirementStatusBadge } from "./requirement-status-badge";
import {
  useRequirement,
  useRequirementVersions,
  useApproveRequirement,
  useRejectRequirement,
  useUpdateRequirement,
} from "@/hooks/use-requirements";
import type { RequirementDTO } from "@/types";

interface RequirementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirementId: string | null;
  tenderId: string;
  versionId: string;
  onOpenRuleSelector: (req: RequirementDTO) => void;
}

export const RequirementDetailModal: React.FC<RequirementDetailModalProps> = ({
  isOpen,
  onClose,
  requirementId,
  tenderId,
  versionId,
  onOpenRuleSelector,
}) => {
  const { data: detailResponse, isLoading, refetch } = useRequirement(requirementId || undefined);
  const { data: historyResponse, isLoading: isHistoryLoading } = useRequirementVersions(
    requirementId || undefined
  );

  const requirement = detailResponse?.data;
  const history = historyResponse?.data || [];
  const currentVersion = requirement?.currentVersion;

  const approveMutation = useApproveRequirement(requirement?.id ?? "", tenderId, versionId);
  const rejectMutation = useRejectRequirement(requirement?.id ?? "", tenderId, versionId);
  const updateMutation = useUpdateRequirement(requirement?.id ?? "", tenderId, versionId);

  const [activeTab, setActiveTab] = useState<"detail" | "history" | "edit">("detail");
  const [rejecting, setRejecting] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [approvalNotes, setApprovalNotes] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editClause, setEditClause] = useState<string>("");
  const [editPage, setEditPage] = useState<string>("");
  const [editExpectedValue, setEditExpectedValue] = useState<string>("");

  React.useEffect(() => {
    if (currentVersion) {
      setEditTitle(currentVersion.title || "");
      setEditDescription(currentVersion.description || "");
      setEditClause(currentVersion.source.clauseRef || "");
      setEditPage(currentVersion.source.page ? String(currentVersion.source.page) : "");
      setEditExpectedValue(currentVersion.expectedValue || "");
    }
  }, [currentVersion]);

  if (!isOpen || !requirementId) return null;

  const hasClause = Boolean(currentVersion?.source.clauseRef?.trim());
  const hasPage = Boolean(currentVersion?.source.page && currentVersion.source.page > 0);
  const hasRule = Boolean(currentVersion?.ruleMapping);
  const canApprove = hasClause && hasPage && hasRule && currentVersion?.status !== "APPROVED";

  const handleApprove = async () => {
    if (!requirement || !currentVersion) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      await approveMutation.mutateAsync({
        expectedCurrentVersionId: currentVersion.id,
        notes: approvalNotes.trim() || undefined,
      });
      setActionSuccess("Requirement approved successfully and added to tender evaluation baseline.");
      refetch();
    } catch (err: any) {
      setActionError(err.message || "Failed to approve requirement.");
    }
  };

  const handleReject = async () => {
    if (!requirement || !currentVersion) return;
    setActionError(null);
    setActionSuccess(null);

    if (rejectionReason.trim().length < 5) {
      setActionError("Rejection reason must be at least 5 characters.");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        expectedCurrentVersionId: currentVersion.id,
        rejectionReason: rejectionReason.trim(),
      });
      setRejecting(false);
      setActionSuccess("Requirement rejected.");
      refetch();
    } catch (err: any) {
      setActionError(err.message || "Failed to reject requirement.");
    }
  };

  const handleSaveEdit = async () => {
    if (!requirement || !currentVersion) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await updateMutation.mutateAsync({
        expectedCurrentVersionId: currentVersion.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        sourceClause: editClause.trim() || null,
        sourcePage: editPage ? parseInt(editPage, 10) : null,
        expectedValue: editExpectedValue.trim() || null,
      });

      if (res.data.wasNewVersionCreated) {
        setActionSuccess(
          "Approved requirement amended: Previous version preserved and new version created in IN_REVIEW."
        );
      } else {
        setActionSuccess("Requirement updated successfully.");
      }
      setActiveTab("detail");
      refetch();
    } catch (err: any) {
      setActionError(err.message || "Failed to save requirement edits.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded">
              {requirement?.identifier || "..."}
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-md">
              {currentVersion?.title || "Requirement Review"}
            </h2>
            {currentVersion && (
              <RequirementStatusBadge
                status={currentVersion.status}
                aiGenerated={currentVersion.ai.generated}
              />
            )}
            {currentVersion && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                v{currentVersion.versionNumber}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("detail")}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "detail"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Evidentiary Details & Review</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "history"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Version History ({history.length || requirement?.versionsCount || 1})</span>
          </button>

          <button
            onClick={() => setActiveTab("edit")}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "edit"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Requirement</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading || !currentVersion ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading requirement details...</div>
          ) : activeTab === "detail" ? (
            <div className="space-y-6">
              {/* Approval Prerequisite Banner if not yet approved */}
              {currentVersion.status !== "APPROVED" && currentVersion.status !== "REJECTED" && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    canApprove
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {canApprove ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>
                      {canApprove
                        ? "All Statutory Review Prerequisites Met"
                        : "Mandatory Review Prerequisites for Approval"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                    <div
                      className={`p-2 rounded border ${
                        hasClause
                          ? "bg-white border-emerald-200 text-emerald-800"
                          : "bg-white border-amber-300 text-amber-900"
                      }`}
                    >
                      <span className="font-semibold">Source Clause: </span>
                      {hasClause ? (
                        <code className="font-mono">{currentVersion.source.clauseRef}</code>
                      ) : (
                        <span className="text-rose-600 font-bold">Missing ⚠️</span>
                      )}
                    </div>

                    <div
                      className={`p-2 rounded border ${
                        hasPage
                          ? "bg-white border-emerald-200 text-emerald-800"
                          : "bg-white border-amber-300 text-amber-900"
                      }`}
                    >
                      <span className="font-semibold">Source Page: </span>
                      {hasPage ? (
                        <code className="font-mono">Page {currentVersion.source.page}</code>
                      ) : (
                        <span className="text-rose-600 font-bold">Missing ⚠️</span>
                      )}
                    </div>

                    <div
                      className={`p-2 rounded border ${
                        hasRule
                          ? "bg-white border-emerald-200 text-emerald-800"
                          : "bg-white border-amber-300 text-amber-900"
                      }`}
                    >
                      <span className="font-semibold">Compliance Rule: </span>
                      {hasRule ? (
                        <code className="font-mono">{currentVersion.ruleMapping?.ruleId}</code>
                      ) : (
                        <span className="text-rose-600 font-bold">Unmapped ⚠️</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-side Layout: Clause Provenance vs Evaluation Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Pane: Clause Evidentiary Trace */}
                <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/40">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Evidentiary Source Provenance
                    </span>
                    {currentVersion.ai.generated && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        AI Extraction ({Math.round((currentVersion.ai.confidence || 0.85) * 100)}%
                        confidence)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Clause Reference:</span>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {currentVersion.source.clauseRef || "Not specified"}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Document Page:</span>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {currentVersion.source.page ? `Page ${currentVersion.source.page}` : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-medium">Source Document:</span>
                    <div className="text-xs font-medium text-slate-800 truncate mt-0.5">
                      {currentVersion.source.documentName || "Tender Document Specification"}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-medium block mb-1">
                      Raw Extracted Text:
                    </span>
                    <div className="p-3 bg-white border border-slate-200 rounded-md text-xs text-slate-700 font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {currentVersion.source.text || currentVersion.description}
                    </div>
                  </div>

                  {currentVersion.ai.generated && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
                      <strong>Advisory Notice:</strong> This clause was suggested by advisory intelligence.
                      Reviewers must verify wording against official tender documents before approval.
                    </div>
                  )}
                </div>

                {/* Right Pane: Evaluation Parameters & Controlled Rule */}
                <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/40">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Specification & Rule Mapping
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {currentVersion.category}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-medium">Description:</span>
                    <div className="text-xs text-slate-800 mt-1 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                      {currentVersion.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Mandatory Requirement:</span>
                      <div className="mt-0.5">
                        {currentVersion.mandatory ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Mandatory (Disqualifying)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Optional
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Expected Value:</span>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {currentVersion.expectedValue || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-medium">Required Evidence:</span>
                    <div className="text-xs font-mono font-semibold text-slate-800 mt-0.5">
                      {currentVersion.requiredEvidenceType || "Standard Procurement Submission"}
                    </div>
                  </div>

                  {/* Controlled Rule Mapping Section */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        Controlled Compliance Rule
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => onOpenRuleSelector(requirement)}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>{currentVersion.ruleMapping ? "Change Rule" : "Map Rule"}</span>
                      </Button>
                    </div>

                    {currentVersion.ruleMapping ? (
                      <div className="p-3 bg-white rounded-md border border-indigo-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-700">
                            {currentVersion.ruleMapping.ruleId}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            v{currentVersion.ruleMapping.ruleVersion}
                          </span>
                        </div>
                        {currentVersion.ruleMapping.operator && (
                          <div className="text-[11px] text-slate-600">
                            Operator: <code className="font-mono font-semibold">{currentVersion.ruleMapping.operator}</code>
                          </div>
                        )}
                        {currentVersion.ruleMapping.expectedValue && (
                          <div className="text-[11px] text-slate-600">
                            Expected: <code className="font-mono font-semibold">{currentVersion.ruleMapping.expectedValue}</code>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center justify-between">
                        <span>No compliance rule mapped. Rule mapping is required for approval.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Prompt if expanding */}
              {rejecting && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Reject Proposed Requirement</span>
                  </div>
                  <Input
                    placeholder="Provide mandatory reason for rejection (min 5 characters)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReject}
                      disabled={rejectionReason.trim().length < 5 || rejectMutation.isPending}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "history" ? (
            /* Audit Version History Timeline */
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                BidSure maintains strict evidentiary immutability. When an approved requirement is
                edited, a new version is created in <code className="font-mono">IN_REVIEW</code> state, preserving
                all previous versions for audit verification.
              </div>

              {isHistoryLoading ? (
                <div className="text-xs text-slate-400 py-6 text-center">Loading version history...</div>
              ) : (
                <div className="space-y-3">
                  {history.map((ver) => (
                    <div
                      key={ver.id}
                      className={`p-4 rounded-lg border text-xs ${
                        ver.id === currentVersion.id
                          ? "bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-300"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 text-sm">
                            v{ver.versionNumber}
                          </span>
                          <RequirementStatusBadge status={ver.status} aiGenerated={ver.ai.generated} />
                          {ver.id === currentVersion.id && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(ver.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 text-slate-800 font-semibold">{ver.title}</div>
                      <div className="text-slate-600 mt-1">{ver.description}</div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <div>
                          <span>Created By: </span>
                          <span className="font-semibold text-slate-700">
                            {ver.createdByName || (ver.ai.generated ? "AI Ingestion Worker" : "Procurement Officer")}
                          </span>
                        </div>
                        {ver.approvedByName && (
                          <div>
                            <span>Approved By: </span>
                            <span className="font-semibold text-emerald-700">{ver.approvedByName}</span>
                          </div>
                        )}
                        {ver.rejectionReason && (
                          <div className="col-span-2 text-rose-700">
                            <span>Rejection Reason: </span>
                            <span className="font-medium">{ver.rejectionReason}</span>
                          </div>
                        )}
                        {ver.supersedesVersionId && (
                          <div className="col-span-2 font-mono text-[10px] text-slate-400">
                            Supersedes Version ID: {ver.supersedesVersionId}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Edit / Amend Form */
            <div className="space-y-4">
              {currentVersion.status === "APPROVED" && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Evidentiary Immutability Protection</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This requirement is currently <code className="font-mono font-bold">APPROVED</code>. Editing it
                    will not alter historical records. Instead, a new version (v{currentVersion.versionNumber + 1}) will
                    be generated with status <code className="font-mono font-bold">IN_REVIEW</code>, requiring fresh
                    human review and approval.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Source Clause Reference
                  </label>
                  <Input
                    value={editClause}
                    onChange={(e) => setEditClause(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Page Number
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={editPage}
                    onChange={(e) => setEditPage(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Value / Threshold
                </label>
                <Input
                  value={editExpectedValue}
                  onChange={(e) => setEditExpectedValue(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab("detail")}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Amendments"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50">
          <div className="text-xs text-slate-500 font-mono">
            Version ID: {currentVersion?.id?.slice(0, 8)}...
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>

            {currentVersion && currentVersion.status !== "APPROVED" && currentVersion.status !== "REJECTED" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejecting(true)}
                  disabled={rejecting || approveMutation.isPending}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <XCircle className="w-4 h-4 mr-1 text-rose-500" />
                  Reject
                </Button>

                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={!canApprove || approveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{approveMutation.isPending ? "Approving..." : "Approve Requirement"}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
