import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import { useTender } from "@/hooks/use-tenders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

export const OfficerTenderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: tenderResponse, isLoading, isError, error, refetch } = useTender(id);

  const tender = tenderResponse?.data;
  const currentVersion = tender?.currentVersion;
  const requirements = currentVersion?.requirements || [];

  if (isLoading) {
    return <LoadingState message="Loading tender details and requirements..." />;
  }

  if (isError || !tender) {
    return (
      <div className="space-y-4">
        <Link to="/officer/tenders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenders</span>
          </Button>
        </Link>
        <ErrorState
          title="Tender Not Found"
          error={error || "The requested tender could not be retrieved."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/officer/tenders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenders</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
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
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
            v{currentVersion?.versionNumber ?? 1}
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold font-mono border border-blue-200">
            {tender.referenceNumber}
          </span>
          <span className="text-xs text-slate-400 font-mono">ID: {tender.id}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {tender.title}
        </h1>
        {currentVersion?.description && (
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {currentVersion.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Created: {new Date(tender.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Last Updated: {new Date(tender.updatedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">Org: {tender.organizationId}</span>
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-base font-semibold">
                  Specification Requirements ({requirements.length})
                </CardTitle>
                <CardDescription>
                  Clauses defined under current version v{currentVersion?.versionNumber ?? 1}
                </CardDescription>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono font-medium">
              Deterministic Rules
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {requirements.length === 0 ? (
            <EmptyState
              title="No Requirements Defined"
              message="This tender version does not yet have associated evaluation requirements."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Requirements List">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Clause ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Mandatory</th>
                    <th className="py-3 px-4">Requirement Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap text-xs">
                        {req.identifier}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {req.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {req.currentVersion?.mandatory ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            Mandatory
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 leading-relaxed">
                        {req.currentVersion?.description || "No description provided."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
