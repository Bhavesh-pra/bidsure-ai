import React from "react";
import { Link } from "react-router-dom";
import {
  FolderLock,
  HardDrive,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
  Send,
  Layers,
} from "lucide-react";
import { useBids } from "@/hooks/use-bids";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

export const DocumentsPage: React.FC = () => {
  const { data: bidsResponse, isLoading, isError, error, refetch } = useBids();
  const bids = bidsResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FolderLock className="w-6 h-6 text-indigo-600" aria-hidden="true" />
          Document Vault &amp; Attachments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Secure document repository for bidder proposal submissions, statutory certificates, and commercial schedules.
        </p>
      </div>

      {/* Security Principles Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Antivirus Inspection</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every uploaded document is automatically quarantined and inspected for malicious payloads and macros.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>SHA-256 Provenance</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Cryptographic hashes guarantee tamper-proof document chain of custody across revisions.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>Phase 08 Storage Boundary</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Ingested status denotes secure storage. Mandatory criteria evaluation occurs during official tender opening.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bids Document Vaults */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Proposal Document Packages</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Documents are managed per proposal. Select a proposal below to upload, replace, or inspect attached tender documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {isLoading && <LoadingState message="Loading proposal document packages..." />}

          {isError && (
            <ErrorState
              title="Unable to load proposals"
              error={error}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && bids.length === 0 && (
            <EmptyState
              title="No Proposal Packages Found"
              message="Create a draft proposal for an active tender to manage and upload your required submission documents."
            />
          )}

          {!isLoading && !isError && bids.length > 0 && (
            <div className="divide-y divide-slate-100">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {bid.bidReference}
                      </span>
                      <Badge
                        variant={bid.status === "DRAFT" ? "warning" : "default"}
                        className="text-[11px]"
                      >
                        {bid.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {bid.tender?.title || "Procurement Tender"}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      Ref: {bid.tender?.referenceNumber} • Bound to Version {bid.tenderVersion?.versionNumber ?? 1}
                    </p>
                  </div>

                  <Link to={`/bidder/bids/${bid.id}`}>
                    <Button size="sm" variant="outline" className="gap-2 text-xs font-medium w-full sm:w-auto">
                      <span>Open Document Vault</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
