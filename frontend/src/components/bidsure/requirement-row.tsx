import React from "react";
import { cn } from "@/lib/utils";
import { ComplianceStatusBadge } from "./compliance-status";
import type { ComplianceStatus } from "@/components/ui/status-indicator";

interface RequirementRowProps {
  /** Requirement identifier (e.g. "REQ-001") */
  id: string;
  /** Requirement label */
  label: string;
  /** Compliance status from backend */
  status: ComplianceStatus;
  /** Optional short note */
  note?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * RequirementRow — renders one requirement in a requirements table.
 * Status is received from the backend. The row never evaluates status.
 */
export const RequirementRow: React.FC<RequirementRowProps> = ({
  id,
  label,
  status,
  note,
  className,
  onClick,
}) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={cn(
        "flex items-center gap-4 px-4 py-3 border-b border-slate-100 w-full text-left",
        "last:border-b-0",
        onClick &&
          "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset transition-colors cursor-pointer",
        className
      )}
      onClick={onClick}
      aria-label={onClick ? `View details for ${label}` : undefined}
    >
      <span className="w-20 flex-shrink-0 font-mono text-xs text-slate-400">{id}</span>
      <span className="flex-1 text-sm text-slate-800 font-medium leading-snug">{label}</span>
      {note && (
        <span className="hidden sm:block text-xs text-slate-500 max-w-xs truncate">{note}</span>
      )}
      <ComplianceStatusBadge status={status} size="sm" className="flex-shrink-0" />
    </Tag>
  );
};
