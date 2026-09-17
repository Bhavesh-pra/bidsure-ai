import React from "react";
import { ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForbiddenStateProps {
  message?: string;
  className?: string;
}

/**
 * Rendered when the authenticated user lacks permission for a resource (403).
 * The frontend never determines permissions — it renders what the backend returns.
 */
export const ForbiddenState: React.FC<ForbiddenStateProps> = ({
  message = "You do not have permission to access this resource.",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-16 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
        <ShieldOff className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-slate-800">Access Denied</p>
        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
