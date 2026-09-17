import React from "react";
import { Link } from "react-router-dom";
import {
  FileCheck2,
  ArrowRight,
  Calendar,
  DollarSign,
  Building,
} from "lucide-react";
import { useBids } from "@/hooks/use-bids";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

export const OfficerBidsPage: React.FC = () => {
  const { data: bidsResponse, isLoading, isError, error, refetch } = useBids();

  const bids = bidsResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-600" aria-hidden="true" />
            Bids & Vendor Submissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse submitted proposals and attached documentation registered in Neon PostgreSQL.
          </p>
        </div>
      </div>

      {/* Content States */}
      {isLoading && (
        <LoadingState message="Loading vendor bids from database..." />
      )}

      {isError && (
        <ErrorState
          title="Failed to load bids"
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && bids.length === 0 && (
        <EmptyState
          title="No Bids Submitted"
          message="There are currently no vendor bids submitted for evaluation."
        />
      )}

      {!isLoading && !isError && bids.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Submitted Proposals ({bidsResponse?.meta?.total ?? bids.length})
              </CardTitle>
              <span className="text-xs text-slate-500">
                Authoritative Submissions
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Bids List">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Bid Reference</th>
                    <th className="py-3.5 px-4">Tender</th>
                    <th className="py-3.5 px-4">Bidder</th>
                    <th className="py-3.5 px-4">Proposal Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {bids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                        {bid.bidReference}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          {bid.tender?.title || "Unknown Tender"}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {bid.tender?.referenceNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{bid.bidder?.legalName || "Unknown Bidder"}</span>
                        </div>
                        {bid.bidder?.contactEmail && (
                          <div className="text-slate-400 text-[11px]">
                            {bid.bidder.contactEmail}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-800">
                        {bid.totalAmount !== null ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Intl.NumberFormat("en-US").format(bid.totalAmount)} {bid.currency}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            bid.status === "SUBMITTED"
                              ? "default"
                              : bid.status === "ACCEPTED"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {bid.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {bid.submittedAt
                              ? new Date(bid.submittedAt).toLocaleDateString()
                              : new Date(bid.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Link to={`/officer/bids/${bid.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <span>Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
