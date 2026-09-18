import React from "react";
import { Link } from "react-router-dom";
import { Send, ArrowRight, Calendar } from "lucide-react";
import { useBids } from "@/hooks/use-bids";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

export const BidderBidsPage: React.FC = () => {
  const { data: bidsResponse, isLoading, isError, error, refetch } = useBids();

  const bids = bidsResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Send className="w-6 h-6 text-indigo-600" aria-hidden="true" />
          My Proposals & Submissions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track the status of your submitted procurement proposals and attached documents.
        </p>
      </div>

      {/* Content States */}
      {isLoading && (
        <LoadingState message="Loading your submitted proposals..." />
      )}

      {isError && (
        <ErrorState
          title="Failed to load proposals"
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && bids.length === 0 && (
        <EmptyState
          title="No Proposals Submitted"
          message="You have not submitted any bids yet. Browse open solicitations to submit a proposal."
        />
      )}

      {!isLoading && !isError && bids.length > 0 && (
        <div className="space-y-4">
          {bids.map((bid) => (
            <Card key={bid.id} className="hover:border-indigo-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {bid.bidReference}
                      </span>
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
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      {bid.tender?.title || "Procurement Tender"}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Ref: {bid.tender?.referenceNumber} • Spec v{bid.tenderVersion?.versionNumber ?? 1}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    {bid.totalAmount !== null && (
                      <div className="text-sm font-bold text-slate-900">
                        {new Intl.NumberFormat("en-US").format(bid.totalAmount)} {bid.currency}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {bid.submittedAt
                          ? `Submitted: ${new Date(bid.submittedAt).toLocaleDateString()}`
                          : `Created: ${new Date(bid.createdAt).toLocaleDateString()}`}
                      </span>
                    </div>
                    <Link to={`/bidder/bids/${bid.id}`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs mt-1">
                        <span>{bid.status === "DRAFT" ? "Open Workspace" : "View Proposal"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
