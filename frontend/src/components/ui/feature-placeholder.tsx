import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { StatusIndicator, type StatusType } from "./status-indicator";

interface FeaturePlaceholderProps {
  title: string;
  description: string;
  evidenceChainStep?: string;
  statusExample?: StatusType;
}

export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({
  title,
  description,
  evidenceChainStep,
  statusExample,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        {statusExample && <StatusIndicator status={statusExample} />}
      </div>

      {evidenceChainStep && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider">Evidence Chain Step:</span>
          <span>{evidenceChainStep}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Architectural Boundary Established</CardTitle>
          <CardDescription>
            This module route is registered and ready for backend contract implementation in its designated phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-md text-sm text-slate-600">
            <p className="font-medium text-slate-800 mb-1">Architecture Compliance Note:</p>
            <p className="text-xs leading-relaxed text-slate-500">
              The frontend does not calculate deterministic business decisions or pass/fail thresholds locally.
              All business evaluation rules, risk scoring, and evidence verification are retrieved directly from the
              backend truth engine.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
