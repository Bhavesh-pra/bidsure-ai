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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: tendersResponse, isLoading, isError, error, refetch } = useTenders({ page, pageSize });
  const createMutation = useCreateTender();

  const handleOpenModal = () => {
    setTitle("");
    setReferenceNumber("");
    setDescription("");
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
    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
    createMutation.mutate(
      {
        input: {
          title: title.trim(),
          referenceNumber: referenceNumber.trim(),
          description: description.trim() || undefined,
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
            Authoritative procurement specifications backed by Neon PostgreSQL.
          </p>
        </div>
        <Button onClick={handleOpenModal} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>New Tender</span>
        </Button>
      </div>

      {/* Content States */}
      {isLoading && (
        <LoadingState message="Loading procurement tenders from database..." />
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
          title="No Tenders Found"
          message="No procurement tenders have been registered yet. Create your first tender to establish requirement criteria."
          action={{
            label: "Create First Tender",
            onClick: handleOpenModal,
          }}
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
                PostgreSQL Development Branch
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Tenders List">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Title & Details</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Versions</th>
                    <th className="py-3.5 px-4">Created</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {tenders.map((tender) => (
                    <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-700 whitespace-nowrap">
                        {tender.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{tender.title}</div>
                        {tender.currentVersion?.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {tender.currentVersion.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>v{tender.currentVersion?.versionNumber ?? 1}</span>
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {createMutation.isError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">
                      {createMutation.error.code}:
                    </span>{" "}
                    {createMutation.error.message}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="referenceNumber"
                  className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1"
                >
                  Reference Number *
                </label>
                <Input
                  id="referenceNumber"
                  placeholder="e.g. REF-2026-002"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={createMutation.isPending}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Unique procurement reference ID across the organization.
                </p>
              </div>

              <div>
                <label
                  htmlFor="tenderTitle"
                  className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1"
                >
                  Tender Title *
                </label>
                <Input
                  id="tenderTitle"
                  placeholder="e.g. Enterprise Cloud Infrastructure Modernization"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={createMutation.isPending}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="tenderDescription"
                  className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1"
                >
                  Scope Description
                </label>
                <Textarea
                  id="tenderDescription"
                  placeholder="Provide an initial overview of requirements and evaluation objectives..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="gap-1.5">
                  {createMutation.isPending ? "Creating in Database..." : "Create Tender"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
