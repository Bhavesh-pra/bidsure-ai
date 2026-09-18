import React, { useState } from "react";
import { PlusCircle, FileText, AlertCircle, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateRequirement } from "@/hooks/use-requirements";
import type { RequirementCategory } from "@/types";

interface CreateRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: string;
  versionId: string;
}

const CATEGORIES: RequirementCategory[] = [
  "TURNOVER",
  "NET_WORTH",
  "GST_REGISTRATION",
  "PAN_REGISTRATION",
  "UDYAM_REGISTRATION",
  "SIMILAR_WORK_EXPERIENCE",
  "MANPOWER_CAPABILITY",
  "EQUIPMENT_CAPABILITY",
  "LITIGATION_HISTORY",
  "BLACKLIST_DECLARATION",
  "EARNEST_MONEY_DEPOSIT",
  "INTEGRITY_PACT",
  "ISO_CERTIFICATION",
  "OTHER",
];

export const CreateRequirementModal: React.FC<CreateRequirementModalProps> = ({
  isOpen,
  onClose,
  tenderId,
  versionId,
}) => {
  const createMutation = useCreateRequirement(tenderId, versionId);

  const [identifier, setIdentifier] = useState<string>(`REQ-${Date.now().toString().slice(-4)}`);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<RequirementCategory>("TURNOVER");
  const [mandatory, setMandatory] = useState<boolean>(true);
  const [sourceClause, setSourceClause] = useState<string>("");
  const [sourcePage, setSourcePage] = useState<string>("");
  const [expectedValue, setExpectedValue] = useState<string>("");
  const [requiredEvidenceType, setRequiredEvidenceType] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !title.trim() || !description.trim()) {
      setErrorMessage("Identifier, Title, and Description are mandatory.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        identifier: identifier.trim(),
        title: title.trim(),
        description: description.trim(),
        category,
        mandatory,
        sourceClause: sourceClause.trim() || null,
        sourcePage: sourcePage ? parseInt(sourcePage, 10) : null,
        expectedValue: expectedValue.trim() || null,
        requiredEvidenceType: requiredEvidenceType.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create requirement.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Add Evaluation Requirement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identifier <span className="text-rose-500">*</span>
              </label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. REQ-2026-0015"
                className="text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RequirementCategory)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Minimum Average Annual Turnover"
              className="text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify the exact condition bidders must satisfy..."
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mandatory-checkbox"
              checked={mandatory}
              onChange={(e) => setMandatory(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="mandatory-checkbox" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Mandatory Requirement (Non-compliance disqualifies bidder)
            </label>
          </div>

          {/* Source Provenance Inputs */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Evidentiary Source Provenance</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Source Clause Reference
                </label>
                <Input
                  value={sourceClause}
                  onChange={(e) => setSourceClause(e.target.value)}
                  placeholder="e.g. Clause 4.2.1"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Page Number in Tender Doc
                </label>
                <Input
                  type="number"
                  min="1"
                  value={sourcePage}
                  onChange={(e) => setSourcePage(e.target.value)}
                  placeholder="e.g. 14"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Value / Threshold
              </label>
              <Input
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                placeholder="e.g. 50000000"
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Evidence Type
              </label>
              <Input
                value={requiredEvidenceType}
                onChange={(e) => setRequiredEvidenceType(e.target.value)}
                placeholder="e.g. AUDITED_BALANCE_SHEET"
                className="text-xs font-mono"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" size="sm" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Check className="w-4 h-4" />
            <span>{createMutation.isPending ? "Saving..." : "Create Draft"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
