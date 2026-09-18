import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Layers, Search } from "lucide-react";
import { useTenders } from "@/hooks/use-tenders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

export const BidderTendersPage: React.FC = () => {
  const { data: tendersResponse, isLoading, isError, error, refetch } = useTenders();

  const tenders = tendersResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-indigo-600" aria-hidden="true" />
          Find Solicitations & Tenders
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore published procurement notices and requirement specifications.
        </p>
      </div>

      {/* Content States */}
      {isLoading && (
        <LoadingState message="Loading available procurement opportunities..." />
      )}

      {isError && (
        <ErrorState
          title="Failed to load tenders"
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && tenders.length === 0 && (
        <EmptyState
          title="No Tenders Available"
          message="There are currently no procurement tenders available for submission."
        />
      )}

      {!isLoading && !isError && tenders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tenders.map((tender) => (
            <Card key={tender.id} className="hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {tender.referenceNumber}
                  </span>
                  <Badge
                    variant={
                      tender.status === "PUBLISHED"
                        ? "success"
                        : tender.status === "DRAFT"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {tender.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                  {tender.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tender.currentVersion?.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {tender.currentVersion.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(tender.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>v{tender.currentVersion?.versionNumber ?? 1}</span>
                  </div>
                </div>
                <Link to={`/bidder/tenders/${tender.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                    <span>View Specifications & Requirements</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
