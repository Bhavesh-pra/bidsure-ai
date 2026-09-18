import React, { useState } from "react";
import { Sparkles, Bot, ShieldAlert, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExtractRequirements } from "@/hooks/use-requirements";

interface ExtractRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: string;
  versionId: string;
  tenderTitle: string;
}

export const ExtractRequirementsModal: React.FC<ExtractRequirementsModalProps> = ({
  isOpen,
  onClose,
  tenderId,
  versionId,
  tenderTitle,
}) => {
  const extractMutation = useExtractRequirements(tenderId, versionId);
  const [successResponse, setSuccessResponse] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerExtract = async () => {
    setErrorMessage(null);
    setSuccessResponse(null);
    try {
      const res = await extractMutation.mutateAsync({});
      setSuccessResponse(
        res.data?.message || "Requirement extraction job successfully queued in background worker."
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to trigger requirement extraction.");
    }
  };

  const handleClose = () => {
    setSuccessResponse(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Trigger AI Requirement Extraction</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold uppercase">Target Tender: </span>
            <span className="font-bold text-slate-800">{tenderTitle}</span>
          </div>

          {/* Critical Advisory Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>STRICT COMPLIANCE BOUNDARY (AI IS ADVISORY ONLY)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Extracted requirements will be persisted in <code className="font-mono font-bold">PROPOSED</code> status.
              AI cannot approve, activate, or evaluate requirements. Every proposed requirement requires human verification
              of source clauses, page coordinates, and explicit rule mapping before it becomes part of the evaluation baseline.
            </p>
          </div>

          {successResponse ? (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Job Dispatched Successfully</div>
                <div className="text-[11px] mt-0.5">{successResponse}</div>
              </div>
            </div>
          ) : null}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={extractMutation.isPending}>
            {successResponse ? "Close" : "Cancel"}
          </Button>
          {!successResponse && (
            <Button
              size="sm"
              onClick={handleTriggerExtract}
              disabled={extractMutation.isPending}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {extractMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Queueing Job...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Start Extraction</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
