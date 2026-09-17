import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <AlertOctagon className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Application Error</h1>
        <p className="text-sm text-slate-600 mb-4">
          An unexpected interface error occurred. The system state has been preserved.
        </p>
        {error?.message && (
          <div className="p-3 bg-slate-100 rounded text-left text-xs font-mono text-slate-700 mb-4 overflow-auto max-h-32">
            {error.message}
          </div>
        )}
        <Button
          onClick={() => (resetErrorBoundary ? resetErrorBoundary() : window.location.reload())}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Application
        </Button>
      </div>
    </div>
  );
};
