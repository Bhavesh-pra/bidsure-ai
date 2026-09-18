import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Clock,
  IndianRupee,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
} from "lucide-react";
import { useTender, useTenderVersion } from "@/hooks/use-tenders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

export const OfficerTenderVersionPage: React.FC = () => {
  const { id, versionId } = useParams<{ id: string; versionId: string }>();

  const { data: tenderResponse, isLoading: isTenderLoading } = useTender(id);
  const {
    data: versionResponse,
    isLoading: isVersionLoading,
    isError,
    error,
    refetch,
  } = useTenderVersion(id, versionId);

  const tender = tenderResponse?.data;
  const version = versionResponse?.data;
  const requirements = version?.requirements || [];

  const versionContent =
    version?.content && typeof version.content === "object"
      ? (version.content as Record<string, unknown>)
      : {};

  if (isTenderLoading || isVersionLoading) {
    return <LoadingState message="Loading historical version snapshot from database..." />;
  }

  if (isError || !version || !tender) {
    return (
      <div className="space-y-4 text-left">
        <Link to={`/officer/tenders/${id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tender</span>
          </Button>
        </Link>
        <ErrorState
          title="Tender Version Not Found"
          error={error || "The requested historical version could not be found or does not belong to this tender."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to={`/officer/tenders/${tender.id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tender Details ({tender.referenceNumber})</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Snapshot ID: {version.id}</span>
        </div>
      </div>

      {/* Historical vs Current Status Banner */}
      {version.isCurrent ? (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">CURRENT VERSION v{version.versionNumber}</span>
              <Badge variant="success">Active Baseline</Badge>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              This version is currently authoritative. All submitted bids and evaluations are actively bound to this specification.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">HISTORICAL VERSION v{version.versionNumber}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                Immutable Evidentiary Snapshot
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              This is an immutable historical snapshot created on {new Date(version.createdAt).toLocaleString()}. It is preserved strictly for evidentiary audit, historical integrity, and retroactive evaluation traceability. It cannot be mutated.
            </p>
          </div>
        </div>
      )}

      {/* Version Header Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold font-mono border border-blue-200">
                  {tender.referenceNumber}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Version {version.versionNumber} of {tender.versionsCount ?? 1}
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 mt-2">
                {version.title || tender.title}
              </CardTitle>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Created: {new Date(version.createdAt).toLocaleString()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Key Metrics Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Snapshot Submission Deadline
              </span>
              <p className="text-sm font-semibold text-slate-900 font-mono">
                {versionContent.submissionDeadline
                  ? new Date(String(versionContent.submissionDeadline)).toLocaleString()
                  : "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                Snapshot Estimated Budget
              </span>
              <p className="text-sm font-semibold text-slate-900 font-mono">
                {versionContent.budget !== undefined
                  ? `₹${Number(versionContent.budget).toLocaleString("en-IN")}`
                  : "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Department Context
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {tender.department || "General Procurement"}
              </p>
            </div>
          </div>

          {/* Change Summary */}
          {version.changeSummary && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
              <strong className="text-slate-900">Change Summary / Corrigendum Note:</strong>{" "}
              {version.changeSummary}
            </div>
          )}

          {/* Scope / Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Specification Snapshot Scope</h3>
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md text-xs text-slate-700 leading-relaxed">
              {version.description || "No description provided for this version."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Under This Version */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-base font-semibold">
                Evaluation Criteria Snapshot ({requirements.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Criteria clauses associated with Version {version.versionNumber} snapshot
              </CardDescription>
            </div>
          </div>
          <Link
            to={`/officer/tenders/${tender.id}/versions/${version.id}/requirements`}
          >
            <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Manage Requirements</span>
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {requirements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No evaluation requirements were registered under this version snapshot.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Version Requirements List">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Clause ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Mandatory</th>
                    <th className="py-3 px-4">Clause Description</th>
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
