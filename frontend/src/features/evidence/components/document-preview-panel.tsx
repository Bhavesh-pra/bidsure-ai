import React from "react";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { NormalizedBoundingBox } from "@/types";

export interface DocumentPreviewPanelProps {
  fileName: string;
  documentType?: string | null;
  mimeType?: string;
  activePage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  highlightBox: NormalizedBoundingBox | null;
  pageText?: string;
  className?: string;
}

export const DocumentPreviewPanel: React.FC<DocumentPreviewPanelProps> = ({
  fileName,
  documentType,
  mimeType = "application/pdf",
  activePage,
  pageCount,
  onPageChange,
  highlightBox,
  pageText,
  className = "",
}) => {
  const safePageCount = Math.max(pageCount, 1);

  const handlePrev = () => {
    if (activePage > 1) onPageChange(activePage - 1);
  };

  const handleNext = () => {
    if (activePage < safePageCount) onPageChange(activePage + 1);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-100 rounded-lg border border-slate-200 overflow-hidden ${className}`}>
      {/* Top Header & Page Navigation Controls */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 truncate max-w-[260px]">
          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-semibold text-slate-800 truncate" title={fileName}>
            {fileName}
          </span>
          {documentType && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
              {documentType}
            </span>
          )}
        </div>

        {/* Page controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-md bg-white shadow-xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activePage <= 1}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 text-xs font-mono font-bold text-slate-700 select-none">
              Page {activePage} of {safePageCount}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={activePage >= safePageCount}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            {mimeType}
          </span>
        </div>
      </div>

      {/* Visual Document Viewer Canvas */}
      <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-slate-200/60 min-h-[460px]">
        {/* Document Page Canvas (Aspect Ratio standard A4: 1:1.414) */}
        <div
          className="relative w-full max-w-[540px] aspect-[1/1.38] bg-white shadow-xl rounded-sm border border-slate-300 p-8 flex flex-col justify-between select-text"
          style={{ position: "relative" }}
        >
          {/* Header watermark / simulated document header */}
          <div className="border-b-2 border-slate-200 pb-3 mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 font-mono">
                {documentType ? documentType.replace(/_/g, " ") : "OFFICIAL SUBMISSION DOCUMENT"}
              </span>
              <p className="text-xs text-slate-400 font-mono">{fileName}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Ingestion Provenance</span>
            </div>
          </div>

          {/* Rendered Text Content of Active Page */}
          <div className="flex-1 overflow-hidden font-sans text-xs text-slate-700 leading-relaxed space-y-2">
            {pageText ? (
              pageText.split("\n").slice(0, 18).map((line, i) => (
                <p key={i} className="truncate text-slate-800 font-mono text-[11px]">
                  {line}
                </p>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                Page {activePage} content preview
              </div>
            )}
          </div>

          {/* Normalized Bounding Box Overlay */}
          {highlightBox && (
            <div
              className="absolute border-2 border-blue-600 bg-blue-500/15 rounded-xs transition-all duration-300 animate-pulse pointer-events-none"
              style={{
                left: `${Math.max(0, Math.min(highlightBox.x * 100, 95))}%`,
                top: `${Math.max(0, Math.min(highlightBox.y * 100, 95))}%`,
                width: `${Math.max(5, Math.min(highlightBox.width * 100, 95))}%`,
                height: `${Math.max(3, Math.min(highlightBox.height * 100, 30))}%`,
              }}
            >
              <div className="absolute -top-5 left-0 bg-blue-600 text-white font-mono text-[9px] px-1 py-0.2 rounded shadow-xs flex items-center gap-1 font-bold whitespace-nowrap">
                <MapPin className="w-2.5 h-2.5" />
                <span>Extracted Region</span>
              </div>
            </div>
          )}

          {/* Page Footer */}
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>BidSure Evidence Vault</span>
            <span>Page {activePage}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
