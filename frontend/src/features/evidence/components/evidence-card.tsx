import React from "react";
import {
  FileText,
  MapPin,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ExtractedEvidenceItemDTO, NormalizedBoundingBox } from "@/types";

export interface EvidenceCardProps {
  evidence: ExtractedEvidenceItemDTO;
  isSelected?: boolean;
  onSelectPage?: (page: number, boundingBox: NormalizedBoundingBox | null) => void;
}

const FIELD_LABELS: Record<string, string> = {
  legal_name: "Legal Name of Bidder",
  trade_name: "Trade / Commercial Name",
  gstin: "GST Identification Number (GSTIN)",
  pan: "Permanent Account Number (PAN)",
  udyam_number: "Udyam Registration Number",
  cin: "Corporate Identity Number (CIN)",
  registration_date: "Registration / Inception Date",
  expiry_date: "Validity / Expiry Date",
  registration_status: "Registration Status",
  enterprise_type: "Enterprise Classification",
  registered_address: "Principal Place of Business",
  turnover: "Annual Financial Turnover",
  financial_year: "Financial Year / Period",
  certificate_number: "Statutory Certificate / UDIN",
  issuer: "Issuing Authority / Agency",
};

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  isSelected = false,
  onSelectPage,
}) => {
  const isLowConfidence = evidence.confidence < 0.70;
  const isHighConfidence = evidence.confidence >= 0.85;

  const displayLabel = FIELD_LABELS[evidence.field] || evidence.field.replace(/_/g, " ").toUpperCase();

  const handlePageClick = () => {
    if (onSelectPage) {
      onSelectPage(evidence.page, evidence.boundingBox);
    }
  };

  return (
    <Card
      className={`transition-all duration-200 border text-left ${
        isSelected
          ? "border-blue-500 shadow-md ring-2 ring-blue-500/20 bg-blue-50/20"
          : isLowConfidence
          ? "border-amber-300 bg-amber-50/20 hover:border-amber-400"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Top Header: Field Name & Confidence Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {evidence.field}
            </span>
            <h4 className="text-sm font-semibold text-slate-900 leading-tight">
              {displayLabel}
            </h4>
          </div>

          {/* Semantic Confidence Interpretation */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
                isHighConfidence
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isLowConfidence
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {isLowConfidence ? (
                <AlertTriangle className="w-3 h-3 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              )}
              <span>{Math.round(evidence.confidence * 100)}%</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {isHighConfidence
                ? "High confidence"
                : isLowConfidence
                ? "Review recommended"
                : "Moderate confidence"}
            </span>
          </div>
        </div>

        {/* Value Display */}
        <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
          <p className="text-xs text-slate-500 font-medium">Extracted Value</p>
          <p className="font-mono text-sm font-bold text-slate-900 break-words select-all">
            {evidence.value}
          </p>
          {evidence.normalizedValue && evidence.normalizedValue !== evidence.value && (
            <p className="text-[11px] text-slate-500 font-mono">
              Normalized: <span className="font-semibold text-slate-700">{evidence.normalizedValue}</span>
            </p>
          )}
        </div>

        {/* Source Page & Provenance Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[200px]">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={evidence.documentName}>
              {evidence.documentName}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePageClick}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
            title={`Navigate viewer to Page ${evidence.page}`}
          >
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>Page {evidence.page}</span>
            <ExternalLink className="w-3 h-3 ml-0.5 text-blue-500" />
          </button>
        </div>

        {/* Extraction Status & Footnote */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="inline-flex items-center gap-1 font-mono text-[10px]">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>{evidence.method} • {evidence.pipelineVersion}</span>
          </span>

          <Badge
            variant={isLowConfidence ? "warning" : "secondary"}
            className="text-[10px] uppercase font-mono font-medium"
          >
            {evidence.extractionStatus}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
