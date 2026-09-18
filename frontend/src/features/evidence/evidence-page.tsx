import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileCheck2,
  Cpu,
  Layers,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Eye,
  FileText,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { useBid } from "@/hooks/use-bids";
import { useBidEvidence, useDocumentIntelligence, useProcessDocument } from "@/hooks/use-evidence";
import { useBidDocuments } from "@/hooks/use-documents";
import { EvidenceCard } from "./components/evidence-card";
import { OcrTextViewer } from "./components/ocr-text-viewer";
import { DocumentPreviewPanel } from "./components/document-preview-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { NormalizedBoundingBox, ExtractedEvidenceItemDTO } from "@/types";

export const EvidencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDocId = searchParams.get("docId");

  // Data Queries
  const { data: bidResponse } = useBid(id);
  const { data: documentsResponse } = useBidDocuments(id);
  const {
    data: evidenceResponse,
    isLoading: isEvidenceLoading,
    isError: isEvidenceError,
    error: evidenceError,
    refetch: refetchEvidence,
  } = useBidEvidence(id);

  const processMutation = useProcessDocument(id);

  const bid = bidResponse?.data;
  const documents = documentsResponse?.data || [];
  const allEvidence = evidenceResponse?.data?.evidence || [];

  // Active Document State
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  useEffect(() => {
    if (requestedDocId && documents.some((d) => d.document.id === requestedDocId)) {
      setSelectedDocId(requestedDocId);
    } else if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0]!.document.id);
    }
  }, [documents, requestedDocId, selectedDocId]);

  const activeBidDoc = documents.find((d) => d.document.id === selectedDocId);
  const activeDoc = activeBidDoc?.document;

  // Active Intelligence for selected document
  const {
    data: intelligenceResponse,
    isLoading: isIntelLoading,
    refetch: refetchIntel,
  } = useDocumentIntelligence(id, selectedDocId);

  const intelData = intelligenceResponse?.data;
  const ocrPages = intelData?.ocr?.pages || [];

  // Viewer State (Left Pane)
  const [viewerMode, setViewerMode] = useState<"PREVIEW" | "OCR">("PREVIEW");
  const [activePage, setActivePage] = useState<number>(1);
  const [highlightBox, setHighlightBox] = useState<NormalizedBoundingBox | null>(null);

  // Filter State (Right Pane)
  const [filterMode, setFilterMode] = useState<"ALL" | "REVIEW_RECOMMENDED">("ALL");

  // Evidence for the current document
  const filteredEvidence = useMemo(() => {
    let items = allEvidence;
    if (selectedDocId) {
      items = items.filter((ev) => ev.documentId === selectedDocId);
    }
    if (filterMode === "REVIEW_RECOMMENDED") {
      items = items.filter((ev) => ev.extractionStatus === "REVIEW_RECOMMENDED" || ev.confidence < 0.70);
    }
    return items;
  }, [allEvidence, selectedDocId, filterMode]);

  // Handle source navigation from evidence cards
  const handleSelectPage = (page: number, box: NormalizedBoundingBox | null) => {
    setActivePage(page);
    setHighlightBox(box);
  };

  const handleDocumentChange = (docId: string) => {
    setSelectedDocId(docId);
    setSearchParams({ docId });
    setActivePage(1);
    setHighlightBox(null);
  };

  const handleReprocess = async () => {
    if (!selectedDocId) return;
    await processMutation.mutateAsync(selectedDocId);
  };

  if (isEvidenceLoading && !evidenceResponse) {
    return <LoadingState message="Loading proposal evidence chain..." />;
  }

  if (isEvidenceError) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Link to={`/officer/bids/${id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Proposal</span>
          </Button>
        </Link>
        <ErrorState
          title="Unable to load evidence"
          error={evidenceError || "The evidence records could not be retrieved from the server."}
          onRetry={() => refetchEvidence()}
        />
      </div>
    );
  }

  const activePageText = ocrPages.find((p) => p.page === activePage)?.text || "";

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/officer/bids/${id}`}>
              <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900 -ml-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Proposal</span>
              </Button>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {bid?.bidReference || "Proposal"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            <span>Structured Evidence &amp; OCR Review</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 09: Extracted statutory identifiers, figures, and facts with traceable page-level provenance.
          </p>
        </div>

        {/* Global Reprocess / Refresh Trigger */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReprocess}
            disabled={processMutation.isPending || !selectedDocId}
            className="gap-2 text-xs font-semibold"
          >
            <RotateCw className={`w-3.5 h-3.5 ${processMutation.isPending ? "animate-spin" : ""}`} />
            <span>{processMutation.isPending ? "Reprocessing..." : "Reprocess Intelligence"}</span>
          </Button>
        </div>
      </div>

      {/* Document Selector & Stats Strip */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Document Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-2xl py-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Document:</span>
          </span>
          {documents.map((docItem) => {
            const isCurrent = docItem.document.id === selectedDocId;
            return (
              <button
                key={docItem.id}
                type="button"
                onClick={() => handleDocumentChange(docItem.document.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5 opacity-80" />
                <span className="truncate max-w-[160px]">{docItem.document.fileName}</span>
              </button>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">
              Total Evidence
            </span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {allEvidence.length} fields
            </span>
          </div>

          <div className="text-right pl-4 border-l border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">
              Classification
            </span>
            <span className="text-xs font-bold text-indigo-700 font-mono">
              {intelData?.classification?.documentType || activeBidDoc?.documentType || "CLASSIFYING"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Pane Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Document Visual Viewer / OCR Text Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewerMode("PREVIEW")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewerMode === "PREVIEW"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Document Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setViewerMode("OCR")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewerMode === "OCR"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>OCR Extracted Text</span>
              </button>
            </div>

            {/* OCR Processing Status Badge */}
            {intelData?.ocr && (
              <Badge
                variant={intelData.ocr.status === "COMPLETED" ? "success" : "secondary"}
                className="font-mono text-[11px]"
              >
                OCR: {intelData.ocr.status}
              </Badge>
            )}
          </div>

          {/* Active Viewer */}
          {viewerMode === "PREVIEW" ? (
            <DocumentPreviewPanel
              fileName={activeDoc?.fileName || "document.pdf"}
              documentType={intelData?.classification?.documentType || activeBidDoc?.documentType}
              mimeType={activeDoc?.mediaType || "application/pdf"}
              activePage={activePage}
              pageCount={intelData?.ocr?.pageCount || ocrPages.length || 1}
              onPageChange={(p) => {
                setActivePage(p);
                setHighlightBox(null);
              }}
              highlightBox={highlightBox}
              pageText={activePageText}
            />
          ) : (
            <OcrTextViewer
              pages={ocrPages}
              activePage={activePage}
              onPageChange={(p) => setActivePage(p)}
            />
          )}
        </div>

        {/* RIGHT PANE: Structured Extracted Evidence Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Extracted Evidence ({filteredEvidence.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any page pill to navigate directly to its provenance in the viewer.
              </p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode("ALL")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterMode === "ALL" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("REVIEW_RECOMMENDED")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterMode === "REVIEW_RECOMMENDED"
                    ? "bg-amber-100 text-amber-900 font-bold shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                Needs Review
              </button>
            </div>
          </div>

          {/* Evidence Cards Stack */}
          {filteredEvidence.length === 0 ? (
            <EmptyState
              title="No Structured Fields Extracted"
              message={
                filterMode === "REVIEW_RECOMMENDED"
                  ? "No low-confidence evidence items require manual inspection."
                  : "The document was analyzed successfully, but no supported structured fields were identified."
              }
            />
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredEvidence.map((item) => (
                <EvidenceCard
                  key={item.id}
                  evidence={item}
                  isSelected={item.page === activePage}
                  onSelectPage={handleSelectPage}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
