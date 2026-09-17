import React from "react";
import { cn } from "@/lib/utils";
import { ComplianceStatusBadge } from "./compliance-status";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ComplianceStatus } from "@/components/ui/status-indicator";

interface FindingCardProps {
  /** Finding identifier */
  findingId?: string;
  /** Short title of the finding */
  title: string;
  /** Detailed description from the backend */
  description?: string;
  /** Compliance impact */
  status: ComplianceStatus;
  /** Associated requirement IDs */
  requirementIds?: string[];
  className?: string;
}

/**
 * FindingCard — presents a compliance finding.
 * All finding data originates from the backend. No evaluation occurs here.
 */
export const FindingCard: React.FC<FindingCardProps> = ({
  findingId,
  title,
  description,
  status,
  requirementIds,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          {findingId && (
            <span className="text-xs font-mono text-slate-400">{findingId}</span>
          )}
          <h4 className="text-sm font-semibold text-slate-900 leading-snug mt-0.5">{title}</h4>
        </div>
        <ComplianceStatusBadge status={status} className="flex-shrink-0" />
      </CardHeader>
      <CardContent className="pt-3 pb-4 space-y-3">
        {description && (
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        )}
        {requirementIds && requirementIds.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-sans">Requirements:</span>
            {requirementIds.map((rid) => (
              <span
                key={rid}
                className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
              >
                {rid}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
