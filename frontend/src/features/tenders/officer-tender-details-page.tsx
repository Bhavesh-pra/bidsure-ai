import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Building,
  Tag,
  Plus,
  Clock,
  IndianRupee,
  FileText,
  ExternalLink,
  ShieldCheck,
  Edit2,
  X,
  History,
  Send,
  Lock,
  Archive,
} from "lucide-react";
import {
  useTender,
  useTenderVersions,
  usePublishTender,
  useCloseTender,
  useArchiveTender,
  useUpdateTender,
  useCreateTenderVersion,
} from "@/hooks/use-tenders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

export const OfficerTenderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Data fetching
  const { data: tenderResponse, isLoading, isError, error, refetch } = useTender(id);
  const { data: versionsResponse, isLoading: isVersionsLoading } = useTenderVersions(id);

  // Lifecycle & update mutations
  const publishMutation = usePublishTender();
  const closeMutation = useCloseTender();
  const archiveMutation = useArchiveTender();
  const updateMutation = useUpdateTender();
  const createVersionMutation = useCreateTenderVersion();

  // Modals state
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isEditMetadataModalOpen, setIsEditMetadataModalOpen] = useState(false);

  // Form states for new version
  const [versionTitle, setVersionTitle] = useState("");
  const [versionDesc, setVersionDesc] = useState("");
  const [versionChangeSummary, setVersionChangeSummary] = useState("");
  const [versionDeadline, setVersionDeadline] = useState("");
  const [versionBudget, setVersionBudget] = useState("");
  const [versionStatus, setVersionStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [versionFormError, setVersionFormError] = useState<string | null>(null);

  // Form states for metadata edit
  const [editCategory, setEditCategory] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const tender = tenderResponse?.data;
  const currentVersion = tender?.currentVersion;
  const requirements = currentVersion?.requirements || [];
  const versionsList = versionsResponse?.data || [];

  // Content snapshot typing helper
  const versionContent =
    currentVersion?.content && typeof currentVersion.content === "object"
      ? (currentVersion.content as Record<string, unknown>)
      : {};

  const handleOpenVersionModal = () => {
    if (!tender) return;
    setVersionTitle(tender.title);
    setVersionDesc(currentVersion?.description || "");
    setVersionChangeSummary("");
    setVersionDeadline(
      versionContent.submissionDeadline ? String(versionContent.submissionDeadline).slice(0, 16) : ""
    );
    setVersionBudget(
      versionContent.budget !== undefined ? String(versionContent.budget) : ""
    );
    setVersionStatus(tender.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
    setVersionFormError(null);
    createVersionMutation.reset();
    setIsVersionModalOpen(true);
  };

  const handleCreateVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentVersion) return;

    if (!versionChangeSummary.trim()) {
      setVersionFormError("A brief change summary is required for audit traceability.");
      return;
    }

    setVersionFormError(null);
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;

    const budgetNum = versionBudget ? parseFloat(versionBudget) : undefined;
    const deadlineISO = versionDeadline ? new Date(versionDeadline).toISOString() : undefined;

    createVersionMutation.mutate(
      {
        tenderId: id,
        input: {
          title: versionTitle.trim() || undefined,
          description: versionDesc.trim() || undefined,
          changeSummary: versionChangeSummary.trim(),
          submissionDeadline: deadlineISO,
          budget: budgetNum && !isNaN(budgetNum) ? budgetNum : undefined,
          status: versionStatus,
          expectedCurrentVersionId: currentVersion.id,
        },
        idempotencyKey,
      },
      {
        onSuccess: () => {
          setIsVersionModalOpen(false);
        },
      }
    );
  };

  const handleOpenEditMetadata = () => {
    if (!tender) return;
    setEditTitle(tender.title);
    setEditCategory(tender.category || "");
    setEditDepartment(tender.department || "");
    setIsEditMetadataModalOpen(true);
  };

  const handleEditMetadataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    updateMutation.mutate(
      {
        id,
        input: {
          title: editTitle.trim() || undefined,
          category: editCategory.trim() || undefined,
          department: editDepartment.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditMetadataModalOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return <LoadingState message="Loading authoritative tender specifications..." />;
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
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link to="/officer/tenders">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenders</span>
          </Button>
        </Link>

        {/* Lifecycle Transitions */}
        <div className="flex flex-wrap items-center gap-2">
          {tender.status === "DRAFT" && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => publishMutation.mutate(tender.id)}
              disabled={publishMutation.isPending}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{publishMutation.isPending ? "Publishing..." : "Publish Tender"}</span>
            </Button>
          )}

          {tender.status === "PUBLISHED" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={() => closeMutation.mutate(tender.id)}
              disabled={closeMutation.isPending}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{closeMutation.isPending ? "Closing..." : "Close Submissions"}</span>
            </Button>
          )}

          {tender.status !== "ARCHIVED" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-slate-600 hover:bg-slate-100"
              onClick={() => archiveMutation.mutate(tender.id)}
              disabled={archiveMutation.isPending}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{archiveMutation.isPending ? "Archiving..." : "Archive"}</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-slate-700"
            onClick={handleOpenEditMetadata}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Metadata</span>
          </Button>
        </div>
      </div>

      {/* Tender Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 text-left">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold font-mono border border-blue-200">
              {tender.referenceNumber}
            </span>
            <Badge
              variant={
                tender.status === "PUBLISHED"
                  ? "success"
                  : tender.status === "DRAFT"
                  ? "secondary"
                  : tender.status === "CLOSED"
                  ? "destructive"
                  : "outline"
              }
            >
              {tender.status}
            </Badge>
          </div>
          <span className="text-xs text-slate-400 font-mono">Tender ID: {tender.id}</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{tender.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
            {tender.department && (
              <span className="inline-flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Department: <strong className="text-slate-700">{tender.department}</strong></span>
              </span>
            )}
            {tender.category && (
              <span className="inline-flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Category: <strong className="text-slate-700">{tender.category}</strong></span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Created: {new Date(tender.createdAt).toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Authoritative Current Version Spotlight */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-white text-left">
        <CardHeader className="pb-3 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded shadow-sm">
                <Layers className="w-3.5 h-3.5" />
                CURRENT VERSION v{currentVersion?.versionNumber ?? 1}
              </span>
              <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                Authoritative Procurement Baseline
              </span>
            </div>
            <CardDescription className="mt-1 text-xs text-slate-600">
              Active specification against which all vendor bids and compliance checks will be evaluated.
            </CardDescription>
          </div>

          <Button onClick={handleOpenVersionModal} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            <span>Create New Version</span>
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Snapshot Version Title</span>
              <p className="text-sm font-semibold text-slate-900">
                {currentVersion?.title || tender.title}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Submission Deadline
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
                Estimated Budget
              </span>
              <p className="text-sm font-semibold text-slate-900 font-mono">
                {versionContent.budget !== undefined
                  ? `₹${Number(versionContent.budget).toLocaleString("en-IN")}`
                  : "Not specified"}
              </p>
            </div>
          </div>

          {currentVersion?.description && (
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">Version Scope & Overview</span>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-md border border-slate-100">
                {currentVersion.description}
              </p>
            </div>
          )}

          {currentVersion?.changeSummary && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-50/60 rounded border border-blue-100 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                <strong>Change Summary:</strong> {currentVersion.changeSummary}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version History Table / Section */}
      <Card className="text-left">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <div>
              <CardTitle className="text-base font-semibold">
                Version History ({versionsList.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Immutable historical records preserved for auditability and retroactive evaluation integrity.
              </CardDescription>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">Order: versionNumber DESC</span>
        </CardHeader>
        <CardContent className="p-0">
          {isVersionsLoading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading version history...</div>
          ) : versionsList.length === 0 ? (
            <EmptyState
              title="No Version History"
              message="No previous versions recorded for this tender."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Tender Versions History">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Status & Authority</th>
                    <th className="py-3 px-4">Change Summary</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {versionsList.map((ver) => (
                    <tr
                      key={ver.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        ver.isCurrent ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                        v{ver.versionNumber}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {ver.isCurrent ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded text-xs border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            CURRENT VERSION
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded text-xs border border-slate-200">
                            HISTORICAL VERSION
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {ver.changeSummary || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(ver.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Link to={`/officer/tenders/${tender.id}/versions/${ver.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                            <span>View Snapshot</span>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specification Requirements Section (Current Version) */}
      <Card className="text-left">
        <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-base font-semibold">
                Specification Requirements ({requirements.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Criteria defined under current baseline v{currentVersion?.versionNumber ?? 1}
              </CardDescription>
            </div>
          </div>
          <Link
            to={`/officer/tenders/${tender.id}/versions/${currentVersion?.id || tender.currentVersionId}/requirements`}
          >
            <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review Workspace</span>
            </Button>
          </Link>
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

      {/* Tender Documents Boundary Placeholder (Phase 08 Integration Boundary) */}
      <Card className="text-left bg-slate-50/50 border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <div>
              <CardTitle className="text-sm font-semibold text-slate-700">
                Tender Documents & Corrigenda Attachment
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Phase 08 Secure Document Ingestion boundary. Specifications associated with this tender version will be ingested in Phase 08.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Create New Version Modal */}
      {isVersionModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="version-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h2 id="version-modal-title" className="text-lg font-bold text-slate-900">
                  Create New Tender Version
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-md p-1"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVersionSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 leading-relaxed">
                <strong>Historical Integrity Notice:</strong> You are creating{" "}
                <strong>Version {(currentVersion?.versionNumber ?? 1) + 1}</strong>. Version{" "}
                {currentVersion?.versionNumber ?? 1} will remain unchanged, immutable, and preserved in
                historical version records.
              </div>

              {versionFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{versionFormError}</span>
                </div>
              )}

              {createVersionMutation.isError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {createVersionMutation.error?.code === "CONFLICT"
                      ? "This tender was updated by another user. Refresh to review the latest version."
                      : createVersionMutation.error?.message || "Failed to create new version."}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="ver-title" className="text-xs font-semibold text-slate-700">
                  Version Title
                </label>
                <Input
                  id="ver-title"
                  value={versionTitle}
                  onChange={(e) => setVersionTitle(e.target.value)}
                  disabled={createVersionMutation.isPending}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ver-budget" className="text-xs font-semibold text-slate-700">
                    Budget (INR)
                  </label>
                  <Input
                    id="ver-budget"
                    type="number"
                    min="0"
                    value={versionBudget}
                    onChange={(e) => setVersionBudget(e.target.value)}
                    disabled={createVersionMutation.isPending}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ver-deadline" className="text-xs font-semibold text-slate-700">
                    Submission Deadline
                  </label>
                  <Input
                    id="ver-deadline"
                    type="datetime-local"
                    value={versionDeadline}
                    onChange={(e) => setVersionDeadline(e.target.value)}
                    disabled={createVersionMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="ver-desc" className="text-xs font-semibold text-slate-700">
                  Updated Description / Scope
                </label>
                <Textarea
                  id="ver-desc"
                  rows={3}
                  value={versionDesc}
                  onChange={(e) => setVersionDesc(e.target.value)}
                  disabled={createVersionMutation.isPending}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="ver-summary" className="text-xs font-semibold text-slate-700">
                  Change Summary / Corrigendum Note <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="ver-summary"
                  placeholder="e.g. Corrigendum 1: Extended submission deadline and revised scope"
                  value={versionChangeSummary}
                  onChange={(e) => setVersionChangeSummary(e.target.value)}
                  disabled={createVersionMutation.isPending}
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Recorded in audit trail to document why this new version was created.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVersionModalOpen(false)}
                  disabled={createVersionMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createVersionMutation.isPending}>
                  {createVersionMutation.isPending ? "Creating Version..." : "Confirm & Create Version"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {isEditMetadataModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h2 id="edit-modal-title" className="text-lg font-bold text-slate-900">
                  Edit Tender Metadata
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMetadataModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-md p-1"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditMetadataSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label htmlFor="meta-title" className="text-xs font-semibold text-slate-700">
                  Tender Title
                </label>
                <Input
                  id="meta-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={updateMutation.isPending}
                  required
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="meta-category" className="text-xs font-semibold text-slate-700">
                  Category
                </label>
                <Input
                  id="meta-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="meta-department" className="text-xs font-semibold text-slate-700">
                  Department
                </label>
                <Input
                  id="meta-department"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMetadataModalOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Metadata"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
