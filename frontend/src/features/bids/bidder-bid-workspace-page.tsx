import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Lock,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import { useBid, useUpdateDraftBid, useSubmitBid } from "@/hooks/use-bids";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { BidDocumentWorkspace } from "@/features/documents/bid-document-workspace";

export const BidderBidWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: bidResponse, isLoading, isError, error, refetch } = useBid(id);
  const updateDraftMutation = useUpdateDraftBid();
  const submitBidMutation = useSubmitBid();

  const bid = bidResponse?.data;
  const isDraft = bid?.status === "DRAFT";

  // Form State for DRAFT editing
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [proposalNote, setProposalNote] = useState<string>("");
  const [executiveSummary, setExecutiveSummary] = useState<string>("");

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Submit Confirmation Dialog State
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);

  // Sync form state from loaded bid
  useEffect(() => {
    if (bid) {
      setTotalAmount(bid.totalAmount !== null ? String(bid.totalAmount) : "");
      setCurrency(bid.currency || "INR");
      const meta = (bid.metadata as Record<string, unknown>) || {};
      setProposalNote(typeof meta.proposalNote === "string" ? meta.proposalNote : "");
      setExecutiveSummary(
        typeof meta.executiveSummary === "string" ? meta.executiveSummary : ""
      );
    }
  }, [bid]);

  if (isLoading) {
    return <LoadingState message="Loading Bid Proposal Workspace..." />;
  }

  if (isError || !bid) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Link to="/bidder/bids">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Proposals</span>
          </Button>
        </Link>
        <ErrorState
          title="Proposal Not Found"
          error={error || "The requested bid proposal could not be retrieved from the database."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const parsedAmount = totalAmount.trim() ? parseFloat(totalAmount) : null;
    if (parsedAmount !== null && (isNaN(parsedAmount) || parsedAmount < 0)) {
      setNotification({
        type: "error",
        message: "Total proposal amount must be a positive number.",
      });
      return;
    }

    try {
      await updateDraftMutation.mutateAsync({
        id: bid.id,
        payload: {
          totalAmount: parsedAmount,
          currency,
          expectedVersion: bid.version,
          metadata: {
            proposalNote: proposalNote.trim() || undefined,
            executiveSummary: executiveSummary.trim() || undefined,
          },
        },
      });

      setNotification({
        type: "success",
        message: "Draft proposal successfully saved in database.",
      });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } };
      const code = apiErr.response?.data?.error?.code;
      const msg =
        code === "BID_CONCURRENCY_CONFLICT"
          ? "Concurrency Conflict: This bid was modified in another window. Refreshing latest state..."
          : apiErr.response?.data?.error?.message || "Failed to save draft proposal.";
      setNotification({ type: "error", message: msg });
      if (code === "BID_CONCURRENCY_CONFLICT") {
        refetch();
      }
    }
  };

  const handleConfirmSubmit = async () => {
    setNotification(null);
    setShowSubmitDialog(false);

    try {
      const idempotencyKey = crypto.randomUUID();
      await submitBidMutation.mutateAsync({
        id: bid.id,
        idempotencyKey,
      });

      setNotification({
        type: "success",
        message: "Proposal officially submitted and locked against further edits.",
      });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg =
        apiErr.response?.data?.error?.message ||
        "Submission failed. Please verify required fields and try again.";
      setNotification({ type: "error", message: msg });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/bidder/bids">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Proposals</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              bid.status === "DRAFT"
                ? "secondary"
                : bid.status === "SUBMITTED"
                ? "default"
                : bid.status === "ACCEPTED"
                ? "success"
                : "outline"
            }
          >
            {bid.status}
          </Badge>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            concurrency: v{bid.version}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-semibold">
              {notification.type === "success" ? "Success" : "Action Blocked"}
            </p>
            <p className="text-xs mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Primary Status Banner */}
      {isDraft ? (
        <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Draft Proposal Workspace</span>
            </p>
            <p className="text-xs text-amber-700">
              This proposal is currently in draft. You can update figures, modify scope notes, and submit when ready.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowSubmitDialog(true)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-medium"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Proposal</span>
          </Button>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-bold text-slate-900">
              Submission Locked — Status: {bid.status}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              This proposal was officially submitted on{" "}
              <strong>{bid.submittedAt ? new Date(bid.submittedAt).toLocaleString() : "N/A"}</strong>.
              All amounts and terms are permanently locked and cannot be edited. Evaluation is conducted strictly against Tender Version{" "}
              <strong>{bid.tenderVersion?.versionNumber ?? 1}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Tender and Bound Version Snapshot Information */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {bid.bidReference}
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {bid.id}</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Created: {new Date(bid.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Proposal for: {bid.tender?.title || "Procurement Tender"}
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Tender Ref: {bid.tender?.referenceNumber}
          </p>
        </div>

        <div className="p-3 rounded-md bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 font-medium">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Evaluated against: <strong>Version {bid.tenderVersion?.versionNumber ?? 1} ({bid.tenderVersion?.title || "Specification"})</strong>
            </span>
          </div>
          <span className="font-mono text-[11px] text-blue-600 hidden sm:inline">
            Version ID: {bid.tenderVersionId.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Bid Details / Edit Workspace Form */}
      <Card>
        <form onSubmit={handleSaveDraft}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              {isDraft ? "Edit Proposal Parameters" : "Submitted Proposal Details"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isDraft
                ? "Update your financial bid and executive summary. All changes are saved as a draft proposal."
                : "Authoritative proposal snapshot as submitted to the procurement authority."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Amount and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Total Proposal Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!isDraft}
                  placeholder="e.g. 45000000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className={`w-full text-sm px-3 py-2 rounded-md border focus:outline-none ${
                    isDraft
                      ? "border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Currency</label>
                <select
                  disabled={!isDraft}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full text-sm px-3 py-2 rounded-md border focus:outline-none ${
                    isDraft
                      ? "border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
                  }`}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Proposal Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Proposal Title or Internal Reference
              </label>
              <input
                type="text"
                disabled={!isDraft}
                placeholder="e.g. Turnkey Toll Plaza & Highway Surveillance Delivery"
                value={proposalNote}
                onChange={(e) => setProposalNote(e.target.value)}
                maxLength={255}
                className={`w-full text-sm px-3 py-2 rounded-md border focus:outline-none ${
                  isDraft
                    ? "border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
                }`}
              />
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Executive Summary & Technical Proposal Notes
              </label>
              <textarea
                rows={4}
                disabled={!isDraft}
                placeholder="Provide details regarding your technical solution, warranties, delivery milestones..."
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                className={`w-full text-sm px-3 py-2 rounded-md border focus:outline-none resize-y ${
                  isDraft
                    ? "border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
                }`}
              />
            </div>
          </CardContent>

          {isDraft && (
            <CardFooter className="p-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Optimistic lock version: <strong>v{bid.version}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={updateDraftMutation.isPending}
                  className="gap-1.5 text-xs font-medium"
                >
                  {updateDraftMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Draft</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={submitBidMutation.isPending}
                  className="gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Bid Proposal</span>
                </Button>
              </div>
            </CardFooter>
          )}
        </form>
      </Card>

      {/* Secure Document Ingestion Vault */}
      <BidDocumentWorkspace bidId={bid.id} bidStatus={bid.status} />

      {/* Confirmation Dialog Modal */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Official Bid Submission
                </h3>
                <p className="text-xs text-slate-500">
                  Irreversible state transition to SUBMITTED
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">
                By submitting proposal {bid.bidReference}:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                <li>
                  Your proposal will be permanently locked against all draft edits.
                </li>
                <li>
                  Total proposal value of{" "}
                  <strong>
                    {totalAmount.trim()
                      ? `${parseFloat(totalAmount).toLocaleString()} ${currency}`
                      : "Unspecified"}
                  </strong>{" "}
                  will be locked.
                </li>
                <li>
                  Evaluated strictly against Tender Version{" "}
                  <strong>{bid.tenderVersion?.versionNumber ?? 1} ({bid.tenderVersion?.title || "Specification"})</strong>.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitDialog(false)}
                disabled={submitBidMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmSubmit}
                disabled={submitBidMutation.isPending}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                {submitBidMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to Authority...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
