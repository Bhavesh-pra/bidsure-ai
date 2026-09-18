import React, { useState, useRef } from "react";
import {
  FileUp,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  HardDrive,
  ShieldCheck,
  Info,
  X,
  Loader2,
} from "lucide-react";
import {
  useBidDocuments,
  useUploadDocument,
  useDeleteDocument,
  useRetryDocument,
} from "@/hooks/use-documents";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import type { BidDocumentDTO, DocumentStatus } from "@/types";

export interface BidDocumentWorkspaceProps {
  bidId: string;
  bidStatus: string;
  className?: string;
}

const DOCUMENT_TYPES: { value: string; label: string; description: string }[] = [
  {
    value: "TECHNICAL_BID",
    label: "Technical Proposal",
    description: "Technical specifications, methodologies, and architectural plans",
  },
  {
    value: "FINANCIAL_BID",
    label: "Commercial / Price Schedule",
    description: "Itemized commercial quotes and financial schedules",
  },
  {
    value: "COMPLIANCE_CERTIFICATE",
    label: "Compliance Certificate",
    description: "ISO, CMMI, statutory, or regulatory compliance certificates",
  },
  {
    value: "EMD_PROOF",
    label: "Earnest Money Deposit (EMD)",
    description: "Bank guarantee, demand draft, or payment receipt",
  },
  {
    value: "POWER_OF_ATTORNEY",
    label: "Power of Attorney",
    description: "Authorized signatory resolution and delegation documentation",
  },
  {
    value: "OTHER",
    label: "Supplementary Documentation",
    description: "Additional supporting annexures and documentation",
  },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export const BidDocumentWorkspace: React.FC<BidDocumentWorkspaceProps> = ({
  bidId,
  bidStatus,
  className = "",
}) => {
  const isDraft = bidStatus === "DRAFT";

  // Data fetching
  const { data: documentsResponse, isLoading, isError, error, refetch } = useBidDocuments(bidId);
  const uploadMutation = useUploadDocument(bidId);
  const deleteMutation = useDeleteDocument(bidId);
  const retryMutation = useRetryDocument(bidId);

  // Upload UI State
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>("TECHNICAL_BID");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Modals state
  const [inspectingDoc, setInspectingDoc] = useState<BidDocumentDTO | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<BidDocumentDTO | null>(null);
  const [replacingDoc, setReplacingDoc] = useState<BidDocumentDTO | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const documents = documentsResponse?.data || [];

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size === 0) {
      return "Selected file is empty (0 bytes).";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${formatFileSize(file.size)}) exceeds the 10 MB maximum limit.`;
    }
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Unsupported file format (${extension}). Supported formats: PDF, JPEG, PNG.`;
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!isDraft) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationErr = validateFile(file);
      if (validationErr) {
        setUploadError(validationErr);
        setSelectedFile(null);
      } else {
        setUploadError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationErr = validateFile(file);
      if (validationErr) {
        setUploadError(validationErr);
        setSelectedFile(null);
      } else {
        setUploadError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !isDraft) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        documentType: selectedType,
        onUploadProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      // Clear selection on success
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        "An unexpected error occurred during secure document ingestion.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Replacement upload handler
  const handleReplacementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replacingDoc || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const validationErr = validateFile(file);
    if (validationErr) {
      setUploadError(validationErr);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      await uploadMutation.mutateAsync({
        file,
        documentType: replacingDoc.documentType,
        supersedesDocumentId: replacingDoc.documentId,
        onUploadProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      setReplacingDoc(null);
      setUploadProgress(0);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        "Failed to upload replacement document.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoc || !isDraft) return;

    try {
      await deleteMutation.mutateAsync(deletingDoc.documentId);
      setDeletingDoc(null);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || "Failed to delete document.";
      alert(msg);
    }
  };

  const handleRetry = async (doc: BidDocumentDTO) => {
    if (!isDraft) return;
    try {
      await retryMutation.mutateAsync(doc.documentId);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || "Failed to retry ingestion processing.";
      alert(msg);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(text);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Boundary Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Proposal Document Vault
            </h2>
            <Badge variant="outline" className="text-xs">
              {documents.length} {documents.length === 1 ? "document" : "documents"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Secure storage vault for tender submission requirements with SHA-256 fingerprinting and malware scanning.
          </p>
        </div>

        {!isDraft && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-medium">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Proposal locked ({bidStatus}). Modifications restricted.</span>
          </div>
        )}
      </div>

      {/* Security Scope Disclaimer Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-0.5">
          <p className="font-semibold text-slate-900">
            Secure Ingestion &amp; Storage Assurance
          </p>
          <p className="text-slate-600 leading-relaxed">
            All uploaded files undergo antivirus validation, MIME-type and magic-byte inspection, and cryptographic SHA-256 integrity hashing. Note: The &quot;Ingested&quot; status confirms safe storage receipt only. Compliance evaluation is performed separately during tender review.
          </p>
        </div>
      </div>

      {/* Upload Zone (Visible when DRAFT) */}
      {isDraft ? (
        <Card className="border border-dashed border-slate-300 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-blue-600" />
              <span>Upload Proposal Document</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Select the category and choose or drag a file. Formats: PDF, JPG, PNG (Max: 10 MB per file).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Document Type Dropdown */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="document-type-select"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Requirement Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="document-type-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    disabled={isUploading}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    {DOCUMENT_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Dropzone / Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Document File <span className="text-red-500">*</span>
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? "border-blue-500 bg-blue-50"
                        : selectedFile
                        ? "border-emerald-400 bg-emerald-50/30"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="bid-document-file-input"
                      aria-label="Upload proposal document file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {selectedFile ? (
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-900 truncate">
                            {selectedFile.name}
                          </span>
                          <span className="text-[11px] text-slate-500 flex-shrink-0">
                            ({formatFileSize(selectedFile.size)})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="py-1">
                        <p className="text-xs font-medium text-slate-700">
                          Click to browse or drag and drop file here
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          PDF, JPG, PNG up to 10 MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      Uploading &amp; dispatching to secure pipeline...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Upload failed</p>
                    <p className="mt-0.5">{uploadError}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                    onClick={() => setUploadError(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting File...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Upload &amp; Fingerprint</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Hidden input for replacement file upload */}
      <input
        ref={replaceFileInputRef}
        type="file"
        id="bid-document-replace-input"
        aria-label="Upload replacement document"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleReplacementUpload}
        className="hidden"
      />

      {/* Documents List / Table */}
      {isLoading ? (
        <LoadingState message="Retrieving proposal documents..." />
      ) : isError ? (
        <ErrorState
          title="Unable to load documents"
          error={error || "An error occurred while loading the proposal documents."}
          onRetry={() => refetch()}
        />
      ) : documents.length === 0 ? (
        <div className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50/50">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No documents uploaded yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isDraft
              ? "Upload the required technical proposal, compliance certificates, and commercial bids above."
              : "No documents were attached to this submitted proposal."}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">SHA-256 Fingerprint</th>
                  <th className="py-3 px-4">Ingestion Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {documents.map((bidDoc) => {
                  const doc = bidDoc.document;
                  const typeObj = DOCUMENT_TYPES.find((t) => t.value === bidDoc.documentType);
                  const typeLabel = typeObj ? typeObj.label : bidDoc.documentType;
                  const isProcessing =
                    doc.status === "SCANNING" || doc.status === "PROCESSING" || doc.status === "UPLOADING";
                  const isFailed = doc.status === "FAILED";

                  return (
                    <tr
                      key={bidDoc.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                          {typeLabel}
                        </span>
                        {doc.supersedesDocumentId && (
                          <div className="text-[10px] text-blue-600 font-normal mt-0.5">
                            Replaces prior version
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900 max-w-[200px] truncate" title={doc.originalFilename}>
                        {doc.originalFilename}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {formatFileSize(doc.sizeBytes)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span>{doc.sha256 ? `${doc.sha256.substring(0, 10)}…` : "Pending"}</span>
                          {doc.sha256 && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(doc.sha256)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                              title="Copy full SHA-256 fingerprint"
                              aria-label="Copy full SHA-256 fingerprint"
                            >
                              {copiedSha === doc.sha256 ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <DocumentStatusBadge status={doc.status} />
                        {doc.failureCode && (
                          <div className="text-[10px] text-red-600 font-mono mt-0.5">
                            {doc.failureCode}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                            onClick={() => setInspectingDoc(bidDoc)}
                            title="Inspect document metadata"
                            aria-label="Inspect document metadata"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Retry (if failed & draft) */}
                          {isDraft && isFailed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handleRetry(bidDoc)}
                              disabled={retryMutation.isPending}
                              title="Retry failed ingestion"
                              aria-label="Retry failed ingestion"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${
                                  retryMutation.isPending ? "animate-spin" : ""
                                }`}
                              />
                            </Button>
                          )}

                          {/* Replace (if draft) */}
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setReplacingDoc(bidDoc);
                                replaceFileInputRef.current?.click();
                              }}
                              disabled={isProcessing}
                              title="Upload replacement version"
                              aria-label="Upload replacement version"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* Delete (if draft) */}
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeletingDoc(bidDoc)}
                              disabled={isProcessing || deleteMutation.isPending}
                              title="Delete document"
                              aria-label="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metadata Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Document Provenance &amp; Metadata
                </h3>
                <p className="text-xs text-slate-500">
                  Authoritative record details recorded at ingestion boundary
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                onClick={() => setInspectingDoc(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Original Filename:</span>
                <span className="col-span-2 font-mono text-slate-800 break-all">
                  {inspectingDoc.document.originalFilename}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="col-span-2 text-slate-800 font-medium">
                  {inspectingDoc.documentType}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Media Type / Ext:</span>
                <span className="col-span-2 font-mono text-slate-800">
                  {inspectingDoc.document.mediaType} ({inspectingDoc.document.extension})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Exact Size:</span>
                <span className="col-span-2 font-mono text-slate-800">
                  {inspectingDoc.document.sizeBytes.toLocaleString()} bytes (
                  {formatFileSize(inspectingDoc.document.sizeBytes)})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">SHA-256 Digest:</span>
                <div className="col-span-2 flex items-start gap-1 font-mono text-slate-800 break-all bg-slate-50 p-1.5 rounded">
                  <span>{inspectingDoc.document.sha256}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(inspectingDoc.document.sha256)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 flex-shrink-0"
                    title="Copy full hash"
                  >
                    {copiedSha === inspectingDoc.document.sha256 ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ingestion Status:</span>
                <div className="col-span-2">
                  <DocumentStatusBadge status={inspectingDoc.document.status} showDescription />
                </div>
              </div>

              {inspectingDoc.document.scanStatus && (
                <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Antivirus Scan:</span>
                  <span className="col-span-2 font-mono text-slate-800">
                    {inspectingDoc.document.scanStatus} (
                    {inspectingDoc.document.scanTimestamp
                      ? new Date(inspectingDoc.document.scanTimestamp).toLocaleString()
                      : "recorded"}
                    )
                  </span>
                </div>
              )}

              {inspectingDoc.document.failureCode && (
                <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100 bg-red-50/50 p-2 rounded">
                  <span className="text-red-700 font-medium">Failure Code:</span>
                  <div className="col-span-2 text-red-700">
                    <p className="font-mono font-bold">{inspectingDoc.document.failureCode}</p>
                    <p className="mt-0.5">{inspectingDoc.document.failureMessage}</p>
                  </div>
                </div>
              )}

              {inspectingDoc.document.supersedesDocumentId && (
                <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Supersedes ID:</span>
                  <span className="col-span-2 font-mono text-slate-600 text-[11px] break-all">
                    {inspectingDoc.document.supersedesDocumentId}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 py-1">
                <span className="text-slate-500 font-medium">Ingested At:</span>
                <span className="col-span-2 text-slate-700">
                  {new Date(inspectingDoc.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingDoc(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Remove Proposal Document?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to unlink and delete{" "}
              <strong className="text-slate-900 font-mono">
                {deletingDoc.document.originalFilename}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingDoc(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="gap-1.5"
              >
                {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
