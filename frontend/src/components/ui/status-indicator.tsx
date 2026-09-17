import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Authoritative compliance status set.
// These are the ONLY valid status values in the BidSure platform.
// The frontend NEVER calculates or infers these — they are received from
// the backend and rendered here.
//
// ACCESSIBILITY RULE: Status must NEVER be communicated by color alone.
// Every status has an icon AND a text label. Do not rely on color.
// ---------------------------------------------------------------------------

export type ComplianceStatus =
  | "PASS"
  | "FAIL"
  | "PENDING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE";

/**
 * @deprecated Use ComplianceStatus instead.
 * Kept for backward compat with Phase 01 feature placeholders.
 */
export type StatusType = ComplianceStatus;

interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  defaultLabel: string;
  /** Screen reader description */
  srDescription: string;
}

const statusConfig: Record<ComplianceStatus, StatusConfig> = {
  PASS: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
    icon: CheckCircle2,
    defaultLabel: "Pass",
    srDescription: "Compliance status: Pass — verified against available evidence",
  },
  FAIL: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
    icon: XCircle,
    defaultLabel: "Fail",
    srDescription: "Compliance status: Fail — requirement not met",
  },
  PENDING: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
    icon: Clock,
    defaultLabel: "Pending",
    srDescription: "Compliance status: Pending — verification in progress",
  },
  REVIEW_REQUIRED: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-300",
    icon: AlertTriangle,
    defaultLabel: "Review Required",
    srDescription:
      "Compliance status: Review Required — additional review needed due to incomplete or uncertain evidence",
  },
  NOT_APPLICABLE: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    icon: MinusCircle,
    defaultLabel: "Not Applicable",
    srDescription: "Compliance status: Not Applicable — requirement does not apply",
  },
};

interface StatusIndicatorProps {
  status: ComplianceStatus;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className,
  size = "md",
}) => {
  const cfg = statusConfig[status] ?? statusConfig.REVIEW_REQUIRED;
  const Icon = cfg.icon;
  const displayText = label ?? cfg.defaultLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-semibold select-none",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
      role="status"
      aria-label={cfg.srDescription}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", "flex-shrink-0")} aria-hidden />
      <span>{displayText}</span>
    </span>
  );
};
