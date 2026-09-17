import React from "react";
import { cn } from "@/lib/utils";
import { ComplianceStatusBadge } from "./compliance-status";
import { SourceBadge, type SourceEnvironment } from "./source-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ComplianceStatus } from "@/components/ui/status-indicator";

interface VerificationCardProps {
  /** Name of the verification check */
  checkName: string;
  /** Authoritative status from backend — never inferred in frontend */
  status: ComplianceStatus;
  /** The data source environment */
  sourceEnvironment?: SourceEnvironment;
  /** Source name (e.g. "MCA21", "GSTIN Registry") */
  sourceName?: string;
  /** Safe message from backend */
  summary?: string;
  /** ISO timestamp of when the verification was run */
  verifiedAt?: string;
  className?: string;
}

/**
 * Verification card — presents a single verification result.
 * PRESENTATION ONLY. Status received from backend, never calculated here.
 */
export const VerificationCard: React.FC<VerificationCardProps> = ({
  checkName,
  status,
  sourceEnvironment = "UNKNOWN",
  sourceName,
  summary,
  verifiedAt,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 leading-snug">{checkName}</h4>
          <SourceBadge environment={sourceEnvironment} sourceName={sourceName} className="mt-1" />
        </div>
        <ComplianceStatusBadge status={status} className="flex-shrink-0" />
      </CardHeader>
      <CardContent className="pt-3 pb-4 space-y-2">
        {summary && <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>}
        {verifiedAt && (
          <p className="text-xs text-slate-400 font-mono">
            Verified: {new Date(verifiedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
