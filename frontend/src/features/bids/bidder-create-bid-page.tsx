import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  FilePlus,
  Layers,
  AlertCircle,
  Loader2,
  Building,
  ShieldAlert,
} from "lucide-react";
import { useTender, useTenderVersion } from "@/hooks/use-tenders";
import { useCreateBid } from "@/hooks/use-bids";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";

export const BidderCreateBidPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tenderId = searchParams.get("tenderId");
  const versionId = searchParams.get("versionId");

  const { data: tenderRes, isLoading: tenderLoading, isError: tenderError } = useTender(
    tenderId || undefined
  );
  const { data: versionRes, isLoading: versionLoading, isError: versionError } = useTenderVersion(
    tenderId || undefined,
    versionId || undefined
  );

  const createBidMutation = useCreateBid();

  const tender = tenderRes?.data;
  const version = versionRes?.data;

  // Form State
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [proposalNote, setProposalNote] = useState<string>("");
  const [executiveSummary, setExecutiveSummary] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!tenderId || !versionId) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Link to="/bidder/tenders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Solicitations</span>
          </Button>
        </Link>
        <ErrorState
          title="Missing Tender or Version Parameters"
          error="A valid tender and tender version must be selected before initiating a bid proposal."
        />
      </div>
    );
  }

  if (tenderLoading || versionLoading) {
    return <LoadingState message="Verifying tender specification and version integrity..." />;
  }

  if (tenderError || versionError || !tender || !version) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Link to="/bidder/tenders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Solicitations</span>
          </Button>
        </Link>
        <ErrorState
          title="Invalid Solicitation"
          error="The selected tender or version specification could not be retrieved from the database."
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = totalAmount.trim() ? parseFloat(totalAmount) : null;
    if (parsedAmount !== null && (isNaN(parsedAmount) || parsedAmount < 0)) {
      setFormError("Total amount must be a positive number.");
      return;
    }

    try {
      const response = await createBidMutation.mutateAsync({
        tenderId,
        tenderVersionId: versionId,
        totalAmount: parsedAmount,
        currency,
        metadata: {
          proposalNote: proposalNote.trim() || undefined,
          executiveSummary: executiveSummary.trim() || undefined,
        },
      });

      if (response.success && response.data?.id) {
        navigate(`/bidder/bids/${response.data.id}`);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } };
      const msg =
        apiErr.response?.data?.error?.message ||
        "Failed to initiate bid proposal draft. Please verify and try again.";
      setFormError(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link to={`/bidder/tenders/${tenderId}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tender Specifications</span>
          </Button>
        </Link>
        <Badge variant="secondary">Step 1: Create Proposal Draft</Badge>
      </div>

      {/* Target Tender & Bound Version Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {tender.referenceNumber}
          </span>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Building className="w-3 h-3" />
            {tender.department || "Procurement Entity"}
          </span>
        </div>
        <h1 className="text-lg font-bold text-slate-900">
          {tender.title}
        </h1>
        <div className="p-3 rounded bg-indigo-50/70 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900 mt-2">
          <div className="flex items-center gap-2 font-medium">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Target Binding: <strong>Version {version.versionNumber} ({version.title})</strong>
            </span>
          </div>
          <span className="font-mono text-[11px] text-indigo-600 hidden sm:inline">
            UUID: {version.id.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-rose-900">
            <p className="font-semibold">Creation Error</p>
            <p className="text-xs text-rose-700 mt-1">{formError}</p>
          </div>
        </div>
      )}

      {/* Proposal Creation Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-indigo-600" />
              Initialize Proposal Workspace
            </CardTitle>
            <CardDescription className="text-xs">
              This creates a persistent <strong>DRAFT</strong> proposal in Neon PostgreSQL. You will be able to refine details and attach documents before final submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Amount and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Initial Proposal Total Amount (Optional for Draft)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 45000000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  You can edit or finalize this amount anytime in your Draft Workspace.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                Proposal Title or Internal Identifier
              </label>
              <input
                type="text"
                placeholder="e.g. Turnkey Highway Surveillance Proposal"
                value={proposalNote}
                onChange={(e) => setProposalNote(e.target.value)}
                maxLength={255}
                className="w-full text-sm px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Executive Summary / Initial Proposal Scope Notes
              </label>
              <textarea
                rows={4}
                placeholder="Provide a high-level summary of your technical solution, delivery commitments, or special terms..."
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>

            {/* Authoritative Notice */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-800">Authoritative State Invariant</p>
                <p>
                  Upon creation, this proposal is assigned state <strong>DRAFT</strong>. You retain full control to modify draft figures and metadata. Only upon explicit submission will the bid transition to <strong>SUBMITTED</strong> and lock against all further changes.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 border-t border-slate-100 flex items-center justify-between">
            <Link to={`/bidder/tenders/${tenderId}`}>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createBidMutation.isPending}
              className="gap-2 font-medium"
            >
              {createBidMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Proposal Draft...</span>
                </>
              ) : (
                <>
                  <FilePlus className="w-4 h-4" />
                  <span>Initialize Bid Proposal</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
