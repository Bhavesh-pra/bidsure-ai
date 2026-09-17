import React from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SourceBadge, type SourceEnvironment } from "./source-badge";

interface EvidenceCardProps {
  /** Identifier or name of the evidence item */
  title: string;
  /** Human-readable type (e.g. "Uploaded Document", "API Response") */
  evidenceType?: string;
  /** Summary / description from backend */
  summary?: string;
  /** Source environment of this evidence */
  sourceEnvironment?: SourceEnvironment;
  sourceName?: string;
  /** ISO timestamp */
  collectedAt?: string;
  className?: string;
}

/**
 * EvidenceCard — presents a single piece of evidence.
 * Presentation only. No compliance calculation occurs here.
 */
export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  title,
  evidenceType,
  summary,
  sourceEnvironment = "UNKNOWN",
  sourceName,
  collectedAt,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start gap-3 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-blue-600" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 leading-snug truncate">{title}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {evidenceType && (
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                {evidenceType}
              </span>
            )}
            <SourceBadge environment={sourceEnvironment} sourceName={sourceName} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-4 space-y-2">
        {summary && <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>}
        {collectedAt && (
          <p className="text-xs text-slate-400 font-mono">
            Collected: {new Date(collectedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
