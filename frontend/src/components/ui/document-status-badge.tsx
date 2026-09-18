import React from "react";
import {
  Loader2,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/types";

interface DocumentStatusConfig {
  label: string;
  description: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
  isAnimated?: boolean;
}

const STATUS_CONFIG: Record<DocumentStatus, DocumentStatusConfig> = {
  UPLOADING: {
    label: "Uploading",
    description: "Uploading document to secure storage...",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Loader2,
    isAnimated: true,
  },
  SCANNING: {
    label: "Scanning",
    description: "Security and antivirus inspection in progress...",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Shield,
    isAnimated: true,
  },
  PROCESSING: {
    label: "Processing",
    description: "Verifying document integrity and cryptographic fingerprint...",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
    isAnimated: true,
  },
  READY: {
    label: "Ingested",
    description: "Secure ingestion and storage processing completed.",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Ingestion Failed",
    description: "Document ingestion processing failed. Retry or re-upload required.",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  },
  QUARANTINED: {
    label: "Quarantined",
    description: "Security threat or malicious signature detected. Document quarantined.",
    className: "bg-rose-100 text-rose-800 border-rose-300 font-bold",
    icon: ShieldAlert,
  },
  REPLACEMENT_REQUIRED: {
    label: "Replacement Required",
    description: "Document has been superseded or requires replacement by bidder.",
    className: "bg-orange-50 text-orange-800 border-orange-200",
    icon: RefreshCw,
  },
};

export interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  showDescription?: boolean;
  className?: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  showDescription = false,
  className,
}) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    description: "Unknown document status",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: AlertCircle,
  };

  const IconComponent = config.icon;

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span
        role="status"
        aria-label={`Document status: ${config.label}`}
        title={config.description}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
          config.className,
          className
        )}
      >
        <IconComponent
          className={cn("w-3.5 h-3.5 flex-shrink-0", config.isAnimated && "animate-spin")}
        />
        <span>{config.label}</span>
      </span>
      {showDescription && (
        <span className="text-[11px] text-muted-foreground leading-tight px-1">
          {config.description}
        </span>
      )}
    </div>
  );
};
