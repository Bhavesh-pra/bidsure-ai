import React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// RiskIndicator — presents a risk level received from the backend.
// NEVER calculates risk. Risk levels are authoritative backend values.
// Accessibility: text label + icon, never color alone.
// ---------------------------------------------------------------------------

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface RiskIndicatorProps {
  level: RiskLevel;
  label?: string;
  showBar?: boolean;
  className?: string;
}

const riskConfig: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string; barWidth: string; icon: string }
> = {
  LOW: {
    label: "Low Risk",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    barWidth: "w-1/4",
    icon: "▪",
  },
  MEDIUM: {
    label: "Medium Risk",
    color: "text-amber-900",
    bg: "bg-amber-50",
    border: "border-amber-300",
    barWidth: "w-2/4",
    icon: "▪▪",
  },
  HIGH: {
    label: "High Risk",
    color: "text-orange-900",
    bg: "bg-orange-50",
    border: "border-orange-300",
    barWidth: "w-3/4",
    icon: "▪▪▪",
  },
  CRITICAL: {
    label: "Critical Risk",
    color: "text-rose-900",
    bg: "bg-rose-50",
    border: "border-rose-300",
    barWidth: "w-full",
    icon: "▪▪▪▪",
  },
};

/**
 * RiskIndicator — renders a risk level badge received from the backend.
 * Does not calculate risk. Risk levels are authoritative backend values.
 */
export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  level,
  label,
  showBar = false,
  className,
}) => {
  const cfg = riskConfig[level] ?? riskConfig.LOW;
  const displayLabel = label ?? cfg.label;

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold select-none",
          cfg.bg,
          cfg.color,
          cfg.border
        )}
        role="status"
        aria-label={`Risk level: ${displayLabel}`}
      >
        <span aria-hidden className="tracking-tighter">{cfg.icon}</span>
        <span>{displayLabel}</span>
      </span>
      {showBar && (
        <div
          className="h-1 w-24 bg-slate-200 rounded-full overflow-hidden"
          aria-hidden
        >
          <div
            className={cn(
              "h-full rounded-full",
              cfg.barWidth,
              level === "LOW" && "bg-emerald-500",
              level === "MEDIUM" && "bg-amber-500",
              level === "HIGH" && "bg-orange-500",
              level === "CRITICAL" && "bg-rose-600"
            )}
          />
        </div>
      )}
    </div>
  );
};
