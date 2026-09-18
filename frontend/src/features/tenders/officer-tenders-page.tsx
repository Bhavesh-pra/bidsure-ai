import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  Plus,
  ArrowRight,
  Calendar,
  Layers,
  X,
  AlertCircle,
  Search,
  Filter,
  Building,
  Tag,
} from "lucide-react";
import { useTenders, useCreateTender } from "@/hooks/use-tenders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

export const OfficerTendersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [budget, setBudget] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const pageSize = 10;

  const {
    data: tendersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useTenders({
    page,
    pageSize,
    search: searchQuery.trim() || undefined,
    status: statusFilter || undefined,
  });

  const createMutation = useCreateTender();

  const handleOpenModal = () => {
    setTitle("");
    setReferenceNumber("");
    setDescription("");
    setCategory("");
    setDepartment("");
    setBudget("");
    setSubmissionDeadline("");
    setValidationError(null);
    createMutation.reset();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !referenceNumber.trim()) {
      setValidationError("Tender title and reference number are required.");
      return;
    }

    setValidationError(null);
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;

    const budgetNumber = budget ? parseFloat(budget) : undefined;
    const deadlineISO = submissionDeadline
      ? new Date(submissionDeadline).toISOString()
      : undefined;

    createMutation.mutate(
      {
        input: {
          title: title.trim(),
          referenceNumber: referenceNumber.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          department: department.trim() || undefined,
          budget: budgetNumber && !isNaN(budgetNumber) ? budgetNumber : undefined,
          submissionDeadline: deadlineISO,
        },
        idempotencyKey,
      },
      {
        onSuccess: () => {
          handleCloseModal();
        },
      }
    );
  };

  const tenders = tendersResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" aria-hidden="true" />
            Tender Solicitations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative government procurement baselines and immutable version history.
          </p>
        </div>
        <Button onClick={handleOpenModal} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>New Tender</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search reference or title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs h-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs h-9 px-3 rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter tenders by status"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Content States */}
      {isLoading && <LoadingState message="Loading procurement tenders from database..." />}

      {isError && (
        <ErrorState
          title="Failed to load tenders"
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && tenders.length === 0 && (
        <EmptyState
          title="No Tenders Found"
          message={
            searchQuery || statusFilter
              ? "No tenders match the current search filters."
              : "No procurement tenders have been registered yet. Create your first tender to establish requirement criteria."
          }
          action={
            searchQuery || statusFilter
              ? undefined
              : {
                  label: "Create First Tender",
                  onClick: handleOpenModal,
                }
          }
        />
      )}

      {!isLoading && !isError && tenders.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Active Solicitations ({tendersResponse?.meta?.total ?? tenders.length})
              </CardTitle>
              <span className="text-xs text-slate-500">
                Server Authoritative · Deterministic Sorting
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Tenders List">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Title & Context</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Version</th>
                    <th className="py-3.5 px-4">Created</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {tenders.map((tender) => (
                    <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-700 whitespace-nowrap text-xs">
                        {tender.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{tender.title}</div>
                        {tender.currentVersion?.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {tender.currentVersion.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                          {tender.department && (
                            <span className="inline-flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {tender.department}
                            </span>
                          )}
                          {tender.category && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              <Tag className="w-2.5 h-2.5 text-slate-400" />
                              {tender.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-semibold font-mono">
                            v{tender.currentVersion?.versionNumber ?? 1}
                          </span>
                          <span className="text-slate-400">
                            ({tender.versionsCount ?? 1} {tender.versionsCount === 1 ? "rev" : "revs"})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(tender.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Link to={`/officer/tenders/${tender.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <span>Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tendersResponse?.meta && tendersResponse.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500">
                  Page <span className="font-medium text-slate-700">{tendersResponse.meta.page}</span> of{" "}
                  <span className="font-medium text-slate-700">{tendersResponse.meta.totalPages}</span> ({tendersResponse.meta.total} tenders)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={tendersResponse.meta.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="text-xs h-8"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={tendersResponse.meta.page >= tendersResponse.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="text-xs h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Tender Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h2 id="modal-title" className="text-lg font-bold text-slate-900">
                  Create New Tender
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 rounded-md p-1"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {createMutation.isError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {createMutation.error?.message || "Failed to create tender. Please verify your input."}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="tender-title" className="text-xs font-semibold text-slate-700">
                  Tender Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="tender-title"
                  placeholder="e.g. Supply and Installation of Weigh-in-Motion Systems"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={createMutation.isPending}
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="tender-ref" className="text-xs font-semibold text-slate-700">
                  Reference Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="tender-ref"
                  placeholder="e.g. GEM/2026/B/000451"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={createMutation.isPending}
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Must be unique within your organization. Alphanumeric, hyphens, and slashes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="tender-category" className="text-xs font-semibold text-slate-700">
                    Category
                  </label>
                  <Input
                    id="tender-category"
                    placeholder="e.g. Infrastructure, IT"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="tender-dept" className="text-xs font-semibold text-slate-700">
                    Department
                  </label>
                  <Input
                    id="tender-dept"
                    placeholder="e.g. Highways Division"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="tender-budget" className="text-xs font-semibold text-slate-700">
                    Estimated Budget (INR)
                  </label>
                  <Input
                    id="tender-budget"
                    type="number"
                    min="0"
                    placeholder="e.g. 50000000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="tender-deadline" className="text-xs font-semibold text-slate-700">
                    Submission Deadline
                  </label>
                  <Input
                    id="tender-deadline"
                    type="datetime-local"
                    value={submissionDeadline}
                    onChange={(e) => setSubmissionDeadline(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="tender-desc" className="text-xs font-semibold text-slate-700">
                  Initial Scope & Specification Description
                </label>
                <Textarea
                  id="tender-desc"
                  placeholder="Outline the scope, eligibility criteria, and key deliverables for Version 1..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md text-xs text-blue-800 leading-relaxed">
                <strong>Atomic Versioning Note:</strong> Creating this tender will automatically generate{" "}
                <strong>Version 1</strong> as the authoritative initial snapshot.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating Tender & v1..." : "Create Tender"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
