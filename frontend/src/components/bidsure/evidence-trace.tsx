import React from "react";
import { Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceBadge, type SourceEnvironment } from "./source-badge";

interface TraceStep {
  stepNumber: number;
  label: string;
  detail?: string;
  sourceEnvironment?: SourceEnvironment;
  sourceName?: string;
  timestamp?: string;
}

interface EvidenceTraceProps {
  steps: TraceStep[];
  className?: string;
}

/**
 * EvidenceTrace — renders the chain of evidence for a compliance decision.
 * Each step is a presentation of data from the backend.
 * The chain itself is never constructed or evaluated in the frontend.
 */
export const EvidenceTrace: React.FC<EvidenceTraceProps> = ({ steps, className }) => {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">No evidence trace available.</p>
    );
  }

  return (
    <ol
      className={cn("space-y-0", className)}
      aria-label="Evidence chain"
    >
      {steps.map((step, idx) => (
        <li key={step.stepNumber} className="flex gap-3">
          {/* Connector line */}
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full border-2 border-blue-400 bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Link className="h-3 w-3 text-blue-600" aria-hidden />
            </div>
            {idx < steps.length - 1 && (
              <div className="w-px flex-1 bg-slate-200 my-1 min-h-[1.5rem]" aria-hidden />
            )}
          </div>

          {/* Step content */}
          <div className="pb-4 min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <span className="text-xs font-mono text-slate-400 mr-1.5">
                  Step {step.stepNumber}
                </span>
                <span className="text-sm font-semibold text-slate-800">{step.label}</span>
              </div>
              {step.sourceEnvironment && (
                <SourceBadge
                  environment={step.sourceEnvironment}
                  sourceName={step.sourceName}
                />
              )}
            </div>
            {step.detail && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.detail}</p>
            )}
            {step.timestamp && (
              <p className="text-xs font-mono text-slate-400 mt-1">
                {new Date(step.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};
