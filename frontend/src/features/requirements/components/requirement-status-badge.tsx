import React from "react";
import { Sparkles, Eye, CheckCircle2, XCircle, History, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RequirementStatus } from "@/types";

interface RequirementStatusBadgeProps {
  status: RequirementStatus;
  aiGenerated?: boolean;
  className?: string;
}

export const RequirementStatusBadge: React.FC<RequirementStatusBadgeProps> = ({
  status,
  aiGenerated = false,
  className = "",
}) => {
  switch (status) {
    case "PROPOSED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}
        >
          {aiGenerated ? <Sparkles className="w-3.5 h-3.5 text-amber-600" /> : <User className="w-3.5 h-3.5 text-amber-600" />}
          <span>{aiGenerated ? "AI Proposed" : "Proposed"}</span>
        </span>
      );
    case "IN_REVIEW":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300 ${className}`}
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>In Review</span>
        </span>
      );
    case "APPROVED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Approved</span>
        </span>
      );
    case "REJECTED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Rejected</span>
        </span>
      );
    case "SUPERSEDED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300 ${className}`}
        >
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>Superseded</span>
        </span>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
