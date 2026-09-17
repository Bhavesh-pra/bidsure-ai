import React from "react";
import { StatusIndicator, type ComplianceStatus } from "@/components/ui/status-indicator";
import { cn } from "@/lib/utils";

interface ComplianceStatusProps {
  /**
   * The compliance status received from the backend.
   * This component NEVER calculates or infers status — it only renders.
   */
  status: ComplianceStatus;
  /**
   * Optional human-readable label override.
   * If omitted, the canonical label for the status is used.
   */
  label?: string;
  /**
   * Optional explanation text displayed below the badge.
   * Should be a safe string sourced from the backend — not calculated here.
   */
  explanation?: string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * BidSure compliance status presentation component.
 *
 * ARCHITECTURAL RULE: This component ONLY renders status received from the backend.
 * It NEVER determines WHY a status is PASS or FAIL.
 * Compliance logic belongs to the backend.
 */
export const ComplianceStatusBadge: React.FC<ComplianceStatusProps> = ({
  status,
  label,
  explanation,
  className,
  size = "md",
}) => {
  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <StatusIndicator status={status} label={label} size={size} />
      {explanation && (
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{explanation}</p>
      )}
    </div>
  );
};
