import React, { useState } from "react";
import {
  FileText,
  Search,
  Copy,
  Check,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface OcrPageData {
  page: number;
  text: string;
  confidence?: number;
}

export interface OcrTextViewerProps {
  pages: OcrPageData[];
  activePage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const OcrTextViewer: React.FC<OcrTextViewerProps> = ({
  pages,
  activePage,
  onPageChange,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const currentPageData = pages.find((p) => p.page === activePage) || pages[0];
  const pageText = currentPageData?.text || "No OCR text extracted for this page.";
  const lines = pageText.split("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Best-effort copy
    }
  };

  const matchesCount = searchTerm.trim()
    ? lines.filter((l) => l.toLowerCase().includes(searchTerm.toLowerCase())).length
    : 0;

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-slate-100 rounded-lg border border-slate-800 overflow-hidden ${className}`}>
      {/* Authoritative Banner: Strict labeling as OCR Extracted Text */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-mono text-xs font-bold tracking-wide uppercase text-blue-300">
            OCR EXTRACTED TEXT
          </span>
          <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
            • Machine read representation
          </span>
        </div>

        {currentPageData?.confidence !== undefined && (
          <span className="text-[11px] font-mono text-slate-400">
            Page OCR Quality:{" "}
            <span className="text-emerald-400 font-bold">
              {Math.round(currentPageData.confidence * 100)}%
            </span>
          </span>
        )}
      </div>

      {/* Toolbar: Page Selector & Search & Copy */}
      <div className="p-3 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Page navigation tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {pages.length > 0 ? (
            pages.map((p) => (
              <button
                key={p.page}
                type="button"
                onClick={() => onPageChange?.(p.page)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                  p.page === activePage
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                Page {p.page}
              </button>
            ))
          ) : (
            <span className="text-slate-400 font-mono">Page 1</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* In-text search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in OCR text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-slate-800 text-slate-100 placeholder-slate-500 rounded text-xs border border-slate-700 focus:outline-none focus:border-blue-500 w-36 sm:w-48 font-mono"
            />
          </div>

          {searchTerm.trim() && (
            <span className="text-[11px] text-blue-400 font-mono">
              {matchesCount} {matchesCount === 1 ? "match" : "matches"}
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Copy page text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area: Line-Numbered Text */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed select-text space-y-1 max-h-[520px]">
        {lines.length === 0 || (lines.length === 1 && !lines[0]) ? (
          <div className="text-center py-12 text-slate-500">
            <p>No textual content identified on Page {activePage}.</p>
          </div>
        ) : (
          lines.map((line, idx) => {
            const isMatch =
              searchTerm.trim().length > 0 &&
              line.toLowerCase().includes(searchTerm.toLowerCase());

            return (
              <div
                key={idx}
                className={`flex items-start gap-4 px-2 py-0.5 rounded transition-colors ${
                  isMatch ? "bg-amber-500/20 text-amber-200 border-l-2 border-amber-400" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-slate-600 select-none text-[11px] w-6 text-right shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-200 break-words whitespace-pre-wrap flex-1">
                  {line}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span>
          Raw OCR stream output. Text selection and copy enabled for provenance review.
        </span>
      </div>
    </div>
  );
};
