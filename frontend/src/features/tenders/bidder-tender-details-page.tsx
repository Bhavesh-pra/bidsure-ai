import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Layers,
  FileCheck2,
  FilePlus,
  Building,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useTender, useTenderVersions, useTenderRequirements } from "@/hooks/use-tenders";
import { useBids } from "@/hooks/use-bids";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

export const BidderTenderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: tenderRes, isLoading: tenderLoading, isError: tenderError, error } = useTender(id);
  const { data: versionsRes, isLoading: versionsLoading } = useTenderVersions(id);
  const { data: bidsRes } = useBids();

  const tender = tenderRes?.data;
  const versions = versionsRes?.data || [];
  const existingBid = bidsRes?.data?.find((b) => b.tenderId === id);

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Default to currentVersionId or first published version
  const activeVersionId =
    selectedVersionId ||
    tender?.currentVersionId ||
    versions[0]?.id ||
    null;

  const selectedVersion = versions.find((v) => v.id === activeVersionId) || versions[0];

  const { data: reqsRes, isLoading: reqsLoading } = useTenderRequirements(
    id,
    selectedVersion?.id
  );
  const requirements = reqsRes?.data || [];

  if (tenderLoading || versionsLoading) {
    return <LoadingState message="Loading tender specification and version history..." />;
  }

  if (tenderError || !tender) {
    return (
      <div className="space-y-4">
        <Link to="/bidder/tenders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenders</span>
          </Button>
        </Link>
        <ErrorState
          title="Tender Not Found"
          error={error || "The requested procurement tender could not be found."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/bidder/tenders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Solicitations</span>
          </Button>
        </Link>
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

      {/* Tender Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {tender.referenceNumber}
          </span>
          {tender.department && (
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Building className="w-3.5 h-3.5" />
              {tender.department}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {tender.title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Published: {new Date(tender.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Active Spec: v{tender.currentVersion?.versionNumber ?? 1}</span>
          </div>
        </div>
      </div>

      {/* Existing Bid Warning / Shortcut Banner */}
      {existingBid && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-amber-900">
            <p className="font-semibold">
              You have already registered a proposal for this solicitation:
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Proposal Ref: <span className="font-mono font-bold">{existingBid.bidReference}</span> • Current Status:{" "}
              <span className="font-bold">{existingBid.status}</span> • Bound Version:{" "}
              <span className="font-bold">v{existingBid.tenderVersion?.versionNumber ?? 1}</span>
            </p>
          </div>
          <Link to={`/bidder/bids/${existingBid.id}`}>
            <Button size="sm" variant="outline" className="border-amber-300 bg-white hover:bg-amber-100 text-xs">
              Open Workspace
            </Button>
          </Link>
        </div>
      )}

      {/* Version Selection & Invariant Panel */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Select Tender Version Specification
              </CardTitle>
              <CardDescription className="text-xs">
                Bids are immutably bound to the specific version chosen at creation.
              </CardDescription>
            </div>
            {selectedVersion && (
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
                Selected: Version {selectedVersion.versionNumber}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {versions.map((ver) => {
              const isSelected = ver.id === selectedVersion?.id;
              const isCurrent = ver.id === tender.currentVersionId;
              return (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => setSelectedVersionId(ver.id)}
                  className={`p-3.5 rounded-lg text-left border transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      Version {ver.versionNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    {ver.title}
                  </p>
                  {ver.changeSummary && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                      {ver.changeSummary}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Version Snapshot Banner */}
          {selectedVersion && (
            <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  <span>Specification Binding Target</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  This bid will be submitted against Version {selectedVersion.versionNumber} ({selectedVersion.title})
                </p>
                <p className="text-xs text-slate-600">
                  The backend enforces that this bid proposal remains permanently evaluated against this snapshot.
                </p>
              </div>

              {!existingBid && tender.status === "PUBLISHED" && (
                <Link
                  to={`/bidder/bids/new?tenderId=${tender.id}&versionId=${selectedVersion.id}`}
                  className="shrink-0"
                >
                  <Button className="gap-2 shadow-sm font-medium">
                    <FilePlus className="w-4 h-4" />
                    <span>Create Proposal against v{selectedVersion.versionNumber}</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirements Section for Selected Version */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold">
            Requirements & Evaluation Criteria (v{selectedVersion?.versionNumber})
          </CardTitle>
          <CardDescription className="text-xs">
            Review the compliance items and documentary requirements specified for this version.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {reqsLoading && <LoadingState message="Loading requirement specifications..." />}
          {!reqsLoading && requirements.length === 0 && (
            <EmptyState
              title="No Requirements Listed"
              message="No specific evaluation criteria were found for this tender version."
            />
          )}
          {!reqsLoading && requirements.length > 0 && (
            <div className="space-y-3">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600">
                          {req.identifier}
                        </span>
                        <h2 className="text-sm font-semibold text-slate-900">
                          {req.category}
                        </h2>
                      </div>
                      {req.currentVersion?.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {req.currentVersion.description}
                        </p>
                      )}
                    </div>
                    {req.currentVersion?.mandatory && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
