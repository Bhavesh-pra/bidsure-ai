import React from "react";
import { LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnauthorizedStateProps {
  message?: string;
  className?: string;
}

/**
 * Rendered when a resource requires authentication that is not present.
 * Phase 04 will wire this to the auth flow. In Phase 02 it is prepared
 * as a reusable presentation component.
 */
export const UnauthorizedState: React.FC<UnauthorizedStateProps> = ({
  message = "You must be signed in to access this resource.",
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
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
        <LockKeyhole className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-slate-800">Authentication Required</p>
        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
