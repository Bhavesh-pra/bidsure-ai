import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Building,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useBid } from "@/hooks/use-bids";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export const OfficerBidDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: bidResponse, isLoading, isError, error, refetch } = useBid(id);

  const bid = bidResponse?.data;
  const documents = bid?.documents || [];

  if (isLoading) {
    return <LoadingState message="Loading bid submission details..." />;
  }

  if (isError || !bid) {
    return (
      <div className="space-y-4">
        <Link to="/officer/bids">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bids</span>
          </Button>
        </Link>
        <ErrorState
          title="Bid Not Found"
          error={error || "The requested bid proposal could not be retrieved."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/officer/bids">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bids</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
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
          {bid.totalAmount !== null && (
            <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
              {new Intl.NumberFormat("en-US").format(bid.totalAmount)} {bid.currency}
            </span>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold font-mono border border-indigo-200">
            {bid.bidReference}
          </span>
          <span className="text-xs text-slate-400 font-mono">ID: {bid.id}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Proposal for: {bid.tender?.title || "Procurement Tender"}
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              Tender Ref: {bid.tender?.referenceNumber} (Spec v{bid.tenderVersion?.versionNumber ?? 1})
            </p>
          </div>
          {bid.totalAmount !== null && (
            <div className="text-right">
              <span className="text-xs text-slate-500 block uppercase font-medium tracking-wider">
                Financial Proposal
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat("en-US").format(bid.totalAmount)} <span className="text-sm font-normal text-slate-600">{bid.currency}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Submitted:{" "}
              {bid.submittedAt
                ? new Date(bid.submittedAt).toLocaleString()
                : new Date(bid.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Bidder: {bid.bidder?.legalName}</span>
          </div>
        </div>
      </div>

      {/* Vendor Profile & Tender Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-600" />
              <CardTitle className="text-sm font-semibold">Vendor Identity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Legal Entity:</span>
              <span className="font-semibold text-slate-900">{bid.bidder?.legalName}</span>
            </div>
            {bid.bidder?.tradeName && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Trade Name:</span>
                <span className="text-slate-800">{bid.bidder.tradeName}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contact Email:</span>
              <span className="text-slate-800 font-mono">{bid.bidder?.contactEmail}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Bidder ID:</span>
              <span className="text-slate-600 font-mono text-[11px]">{bid.bidderId}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <CardTitle className="text-sm font-semibold">Target Solicitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tender Reference:</span>
              <span className="font-mono font-semibold text-blue-700">
                {bid.tender?.referenceNumber}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Specification Version:</span>
              <span className="font-mono text-slate-800">
                v{bid.tenderVersion?.versionNumber ?? 1}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Tender ID:</span>
              <span className="text-slate-600 font-mono text-[11px]">{bid.tenderId}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submitted Documents Section */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <CardTitle className="text-base font-semibold">
                  Submitted Documents & Evidence ({documents.length})
                </CardTitle>
                <CardDescription>
                  Vendor uploads registered for automated verification and evaluation.
                </CardDescription>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono font-medium">
              Document Vault
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <EmptyState
              title="No Documents Attached"
              message="No supporting documents have been attached to this bid submission."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Bid Documents List">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">MIME Type</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Processing Status</th>
                    <th className="py-3 px-4">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {documents.map((docItem) => (
                    <tr key={docItem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{docItem.document.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {docItem.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {docItem.document.mimeType}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {formatBytes(docItem.document.fileSize)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <Badge
                          variant={
                            docItem.document.processingStatus === "COMPLETED"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {docItem.document.processingStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(docItem.document.createdAt).toLocaleDateString()}
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
