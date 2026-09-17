import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/types";

interface ErrorStateProps {
  /** Human-readable context (e.g. "Unable to load tender details.") */
  title?: string;
  /** The normalized ApiError from the backend, or a plain message string */
  error?: ApiError | string | null;
  /** Optional retry callback */
  onRetry?: () => void;
  className?: string;
}

function getErrorMessage(error: ApiError | string | null | undefined): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  if (typeof error === "string") return error;
  return error.message || "An unexpected error occurred.";
}

function getRequestId(error: ApiError | string | null | undefined): string | undefined {
  if (!error || typeof error === "string") return undefined;
  return error.requestId;
}

function getErrorCode(error: ApiError | string | null | undefined): string | undefined {
  if (!error || typeof error === "string") return undefined;
  return error.code;
}

/**
 * Reusable error state for failed API calls / resources.
 * Displays a safe, human-readable message from the backend.
 * Includes the requestId for support/debugging tracing.
 *
 * IMPORTANT: Never display raw stack traces or internal error details here.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  error,
  onRetry,
  className,
}) => {
  const message = getErrorMessage(error);
  const requestId = getRequestId(error);
  const code = getErrorCode(error);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-16 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        {code && (
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">
            Error code: {code}
          </p>
        )}
      </div>

      {requestId && (
        <div className="bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-xs font-mono text-slate-600 max-w-xs w-full text-left">
          <span className="text-slate-400 select-none">Request ID: </span>
          <span className="break-all select-all" title="Copy this ID when contacting support">
            {requestId}
          </span>
        </div>
      )}

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
};
