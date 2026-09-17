import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading data...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`} role="status">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" aria-hidden="true" />
      <span className="text-sm font-medium text-slate-600">{message}</span>
      <span className="sr-only">Loading</span>
    </div>
  );
};
