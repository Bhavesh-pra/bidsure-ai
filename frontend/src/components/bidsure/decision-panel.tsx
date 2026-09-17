import React from "react";
import { cn } from "@/lib/utils";
import { ComplianceStatusBadge } from "./compliance-status";
import { RiskIndicator, type RiskLevel } from "./risk-indicator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ComplianceStatus } from "@/components/ui/status-indicator";

interface DecisionPanelProps {
  /**
   * Overall compliance status from the backend.
   * The officer sees this status — they do not calculate it.
   */
  overallStatus: ComplianceStatus;
  /**
   * Risk level from the backend.
   */
  riskLevel?: RiskLevel;
  /**
   * Summary text from the backend.
   */
  summary?: string;
  /**
   * Officer recommendation from the backend (advisory only).
   */
  recommendation?: string;
  /**
   * Whether the officer has made a final decision (Phase 07+).
   * In Phase 02, this is always false — the panel is presentation-only.
   */
  officerDecisionMade?: boolean;
  className?: string;
}

/**
 * DecisionPanel — presents the compliance outcome and officer advisory.
 *
 * ARCHITECTURAL RULES (Phase 02):
 * - This is a PRESENTATION component only.
 * - The overall status is received from the backend, never calculated here.
 * - The officer decision workflow belongs to Phase 07.
 * - Do NOT add decision-making logic to this component.
 */
export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  overallStatus,
  riskLevel,
  summary,
  recommendation,
  officerDecisionMade = false,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-semibold text-slate-900">Compliance Decision</h3>
          <div className="flex items-center gap-2">
            {riskLevel && <RiskIndicator level={riskLevel} />}
            <ComplianceStatusBadge status={overallStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-5 space-y-4">
        {summary && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Summary
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {recommendation && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Advisory Recommendation
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{recommendation}</p>
              <p className="text-xs text-slate-400 mt-2 italic">
                AI recommendations are advisory only. The officer remains the final decision authority.
              </p>
            </div>
          </>
        )}

        {!officerDecisionMade && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
            Officer decision pending. Phase 07 will implement the decision workflow.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
