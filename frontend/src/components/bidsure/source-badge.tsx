import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// SourceBadge — Source / environment label.
// CRITICAL: Mock or demo data must ALWAYS be visibly labeled.
// Never present MOCK verification as live government verification.
// ---------------------------------------------------------------------------

export type SourceEnvironment = "LIVE" | "MOCK" | "DEMO" | "UNKNOWN";

interface SourceBadgeProps {
  environment: SourceEnvironment;
  sourceName?: string;
  className?: string;
}

const envConfig: Record<
  SourceEnvironment,
  { label: string; variant: "success" | "secondary" | "warning" | "outline"; ariaLabel: string }
> = {
  LIVE: {
    label: "LIVE SOURCE",
    variant: "success",
    ariaLabel: "Data source: Live government/external source",
  },
  MOCK: {
    label: "MOCK SOURCE",
    variant: "secondary",
    ariaLabel: "Data source: Mock data — not live government verification",
  },
  DEMO: {
    label: "DEMO SOURCE",
    variant: "warning",
    ariaLabel: "Data source: Demo data — not live government verification",
  },
  UNKNOWN: {
    label: "UNKNOWN SOURCE",
    variant: "outline",
    ariaLabel: "Data source: Unknown",
  },
};

/**
 * Displays the data source environment prominently.
 * MOCK and DEMO must never be hidden or downplayed.
 */
export const SourceBadge: React.FC<SourceBadgeProps> = ({
  environment,
  sourceName,
  className,
}) => {
  const cfg = envConfig[environment] ?? envConfig.UNKNOWN;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-mono", className)}
      aria-label={cfg.ariaLabel}
    >
      <Badge variant={cfg.variant} className="text-xs tracking-wide">
        {cfg.label}
      </Badge>
      {sourceName && (
        <span className="text-xs text-slate-500 font-sans">{sourceName}</span>
      )}
    </span>
  );
};
