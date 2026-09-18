import React, { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Filter,
  Search,
  Sparkles,
  PlusCircle,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { useTender } from "@/hooks/use-tenders";
import {
  useRequirementsByTenderVersion,
  useApproveRequirement,
} from "@/hooks/use-requirements";
import { RequirementStatusBadge } from "./components/requirement-status-badge";
import { RequirementDetailModal } from "./components/requirement-detail-modal";
import { RuleSelectorModal } from "./components/rule-selector-modal";
import { ExtractRequirementsModal } from "./components/extract-requirements-modal";
import { CreateRequirementModal } from "./components/create-requirement-modal";
import type {
  RequirementDTO,
  RequirementStatus,
  RequirementCategory,
} from "@/types";

export const RequirementsPage: React.FC = () => {
  const { id: routeTenderId, versionId: routeVersionId } = useParams<{
    id?: string;
    versionId?: string;
  }>();

  const [searchParams, setSearchParams] = useSearchParams();

  // Selected state
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [ruleSelectorReq, setRuleSelectorReq] = useState<RequirementDTO | null>(null);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [mandatoryFilter, setMandatoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Tender query to resolve default version if routeVersionId is missing
  const tenderId = routeTenderId || searchParams.get("tenderId") || "";
  const { data: tenderResponse, isLoading: isTenderLoading } = useTender(tenderId || undefined);
  const tender = tenderResponse?.data;

  const versionId =
    routeVersionId ||
    searchParams.get("versionId") ||
    tender?.currentVersionId ||
    tender?.currentVersion?.id ||
    "";

  // Requirements query
  const {
    data: reqsResponse,
    isLoading: isReqsLoading,
    isError,
    error,
    refetch,
  } = useRequirementsByTenderVersion(tenderId || undefined, versionId || undefined, {
    page,
    pageSize,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    category: categoryFilter === "ALL" ? undefined : (categoryFilter as RequirementCategory),
    mandatory: mandatoryFilter === "ALL" ? undefined : mandatoryFilter === "true",
    search: searchQuery.trim() || undefined,
  });

  const requirements = reqsResponse?.data || [];
  const meta = reqsResponse?.meta;

  const approveMutation = useApproveRequirement(selectedReqId ?? "", tenderId, versionId);

  // Metrics calculation
  const totalCount = meta?.total ?? requirements.length;
  const proposedCount = requirements.filter((r) => r.currentVersion?.status === "PROPOSED").length;
  const inReviewCount = requirements.filter((r) => r.currentVersion?.status === "IN_REVIEW").length;
  const approvedCount = requirements.filter((r) => r.currentVersion?.status === "APPROVED").length;
  const unmappedCount = requirements.filter((r) => !r.currentVersion?.ruleMapping).length;

  if (isTenderLoading && tenderId) {
    return <LoadingState message="Loading tender workspace details..." />;
  }

  if (!tenderId || !versionId) {
    return (
      <div className="space-y-4 text-left p-6">
        <ErrorState
          title="Tender or Version Context Required"
          error="Please select an active tender and baseline version to inspect requirements."
        />
        <Link to="/officer/tenders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Tenders List</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Top Breadcrumb / Nav */}
      <div className="flex items-center justify-between">
        <Link to={`/officer/tenders/${tenderId}`}>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tender ({tender?.referenceNumber || "Tender Details"})</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Tender ID: {tenderId.slice(0, 8)}...</span>
          <span className="text-xs font-mono text-slate-400">Version: {versionId.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
              Phase 10 — Baseline Specification
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Ref: {tender?.referenceNumber || "TD-OFFICER"}
            </span>
          </div>
          <h1 className="text-xl font-bold mt-1.5 tracking-tight text-white">
            {tender?.title || "Tender Requirements Intelligence & Review"}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Deterministic evaluation baseline matrix. AI extraction is advisory only; human reviewers
            verify clause citations, page locations, and controlled rule catalog mappings before approval.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsExtractModalOpen(true)}
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Extract Requirements (AI)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Requirement</span>
          </Button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Requirements
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Proposed</span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{proposedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-sm">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>In Review</span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">{inReviewCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved Baseline</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Unmapped Rules</span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{unmappedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {(["ALL", "PROPOSED", "IN_REVIEW", "APPROVED", "REJECTED", "SUPERSEDED"] as const).map(
              (st) => {
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st === "ALL" ? "All Requirements" : st.replace("_", " ")}
                  </button>
                );
              }
            )}
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search identifier, title, or clause..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>

            <div className="w-44">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                <option value="TURNOVER">Turnover</option>
                <option value="NET_WORTH">Net Worth</option>
                <option value="GST_REGISTRATION">GST Status</option>
                <option value="PAN_REGISTRATION">PAN Card</option>
                <option value="UDYAM_REGISTRATION">Udyam Registration</option>
                <option value="SIMILAR_WORK_EXPERIENCE">Work Experience</option>
                <option value="MANPOWER_CAPABILITY">Manpower</option>
                <option value="EQUIPMENT_CAPABILITY">Equipment</option>
                <option value="LITIGATION_HISTORY">Litigation</option>
                <option value="BLACKLIST_DECLARATION">Blacklist</option>
                <option value="EARNEST_MONEY_DEPOSIT">EMD</option>
                <option value="INTEGRITY_PACT">Integrity Pact</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="w-36">
              <select
                value={mandatoryFilter}
                onChange={(e) => {
                  setMandatoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Priority</option>
                <option value="true">Mandatory</option>
                <option value="false">Optional</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isReqsLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading requirements matrix...</div>
          ) : isError ? (
            <div className="p-8">
              <ErrorState
                title="Failed to Load Requirements"
                error={error || "Could not retrieve requirements matrix for this tender."}
                onRetry={() => refetch()}
              />
            </div>
          ) : requirements.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-800">No Requirements Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No evaluation criteria matched the selected filters. You can run automated AI extraction
                from tender documents or add requirements manually.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => setIsExtractModalOpen(true)}
                  className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract from Documents</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Manually</span>
                </Button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" aria-label="Requirements Review Table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Clause Title & Category</th>
                  <th className="py-3 px-4">Source Provenance</th>
                  <th className="py-3 px-4">Status & Origin</th>
                  <th className="py-3 px-4">Controlled Rule</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {requirements.map((req) => {
                  const ver = req.currentVersion;
                  const isApproved = ver?.status === "APPROVED";
                  const hasClause = Boolean(ver?.source.clauseRef);
                  const hasPage = Boolean(ver?.source.page);
                  const isMapped = Boolean(ver?.ruleMapping);

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedReqId(req.id)}
                    >
                      {/* Identifier */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{req.identifier}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            v{ver?.versionNumber || 1}
                          </span>
                        </div>
                      </td>

                      {/* Title & Category */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {ver?.title || req.identifier}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                            {req.category}
                          </span>
                          {ver?.mandatory ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              Optional
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Source Clause & Page */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {hasClause || hasPage ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-slate-800 font-semibold text-[11px]">
                              {ver?.source.clauseRef || "No clause ref"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {hasPage ? `Page ${ver?.source.page}` : "Page unspecified"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                            Citation Missing ⚠️
                          </span>
                        )}
                      </td>

                      {/* Status & Origin */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {ver && (
                          <div className="space-y-1">
                            <RequirementStatusBadge
                              status={ver.status}
                              aiGenerated={ver.ai.generated}
                            />
                            {ver.ai.generated && ver.ai.confidence && (
                              <div className="text-[10px] text-slate-400">
                                AI Conf: {Math.round(ver.ai.confidence * 100)}%
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Rule Mapping */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isMapped ? (
                          <div className="space-y-0.5">
                            <div className="font-mono font-bold text-indigo-700 text-[11px]">
                              {ver?.ruleMapping?.ruleId}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              v{ver?.ruleMapping?.ruleVersion} ({ver?.ruleMapping?.operator || "MATCH"})
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
                            Unmapped ⚠️
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => setSelectedReqId(req.id)}
                            aria-label={`Review ${req.identifier}`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Review
                          </Button>

                          {!isApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              onClick={() => setRuleSelectorReq(req)}
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              Rule
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
            <div>
              Showing Page <span className="font-bold text-slate-700">{meta.page}</span> of{" "}
              <span className="font-bold text-slate-700">{meta.totalPages}</span> ({meta.total} total items)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <RequirementDetailModal
        isOpen={Boolean(selectedReqId)}
        onClose={() => setSelectedReqId(null)}
        requirementId={selectedReqId}
        tenderId={tenderId}
        versionId={versionId}
        onOpenRuleSelector={(req) => {
          setSelectedReqId(null);
          setRuleSelectorReq(req);
        }}
      />

      <RuleSelectorModal
        isOpen={Boolean(ruleSelectorReq)}
        onClose={() => {
          setRuleSelectorReq(null);
          refetch();
        }}
        requirement={ruleSelectorReq}
        tenderId={tenderId}
        versionId={versionId}
      />

      <ExtractRequirementsModal
        isOpen={isExtractModalOpen}
        onClose={() => {
          setIsExtractModalOpen(false);
          refetch();
        }}
        tenderId={tenderId}
        versionId={versionId}
        tenderTitle={tender?.title || "Tender"}
      />

      <CreateRequirementModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
        tenderId={tenderId}
        versionId={versionId}
      />
    </div>
  );
};
