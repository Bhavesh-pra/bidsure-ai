import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  description?: string;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'FAILED';
}

export interface ProcessingStepProgressProps {
  steps: Step[];
  className?: string;
}

export const ProcessingStepProgress: React.FC<ProcessingStepProgressProps> = ({ steps, className = '' }) => {
  return (
    <div className={`rounded-[8px] border border-slate-200 bg-white p-4 space-y-3 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
        Document Pipeline Execution Progress
      </span>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.id || index} className="flex items-center justify-between gap-3 text-xs p-2 rounded-[6px] bg-slate-50 border border-slate-200/80">
            <div className="flex items-center space-x-2.5 min-w-0">
              {step.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
              ) : step.status === 'PROCESSING' ? (
                <Loader2 className="h-4 w-4 text-[#0F766E] animate-spin shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300 shrink-0" />
              )}
              <span className={`font-semibold truncate ${
                step.status === 'COMPLETED'
                  ? 'text-[#15803D]'
                  : step.status === 'PROCESSING'
                  ? 'text-[#0F2747]'
                  : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>

            {step.description && (
              <span className="text-[11px] text-slate-400 font-mono shrink-0 hidden sm:inline">
                {step.description}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingStepProgress;
