import React, { useState, useEffect } from "react";
import { ShieldCheck, BookOpen, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRuleCatalog, useMapComplianceRule } from "@/hooks/use-requirements";
import type { RequirementDTO, RequirementOperator, RuleCatalogItem } from "@/types";

interface RuleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirement: RequirementDTO | null;
  tenderId: string;
  versionId: string;
}

export const RuleSelectorModal: React.FC<RuleSelectorModalProps> = ({
  isOpen,
  onClose,
  requirement,
  tenderId,
  versionId,
}) => {
  const { data: catalogResponse, isLoading: isCatalogLoading } = useRuleCatalog();
  const catalog = catalogResponse?.data || [];

  const mapRuleMutation = useMapComplianceRule(requirement?.id ?? "", tenderId, versionId);

  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [operator, setOperator] = useState<RequirementOperator | "">("");
  const [expectedValue, setExpectedValue] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentRule = catalog.find((r) => r.id === selectedRuleId);

  useEffect(() => {
    if (requirement?.currentVersion?.ruleMapping) {
      setSelectedRuleId(requirement.currentVersion.ruleMapping.ruleId);
      setOperator(requirement.currentVersion.ruleMapping.operator || "");
      setExpectedValue(requirement.currentVersion.ruleMapping.expectedValue || "");
      const params = requirement.currentVersion.ruleMapping.parameters || {};
      const strParams: Record<string, string> = {};
      Object.entries(params).forEach(([k, v]) => {
        strParams[k] = typeof v === "string" ? v : JSON.stringify(v);
      });
      setParameters(strParams);
    } else if (requirement?.currentVersion) {
      // Pre-select based on category or default
      const matchingRule = catalog.find((r) => r.category === requirement.currentVersion?.category);
      if (matchingRule) {
        setSelectedRuleId(matchingRule.id);
        setOperator(matchingRule.supportedOperators[0] || "");
      }
      setExpectedValue(requirement.currentVersion.expectedValue || "");
    }
  }, [requirement, catalog]);

  if (!isOpen || !requirement || !requirement.currentVersion) return null;

  const handleSelectRule = (rule: RuleCatalogItem) => {
    setSelectedRuleId(rule.id);
    setOperator(rule.supportedOperators[0] || "");
    const initialParams: Record<string, string> = {};
    rule.requiredParameters.forEach((p) => {
      initialParams[p.name] = parameters[p.name] || "";
    });
    setParameters(initialParams);
  };

  const handleSave = async () => {
    if (!selectedRuleId) {
      setErrorMessage("Please select a rule from the controlled catalog.");
      return;
    }

    setErrorMessage(null);
    try {
      await mapRuleMutation.mutateAsync({
        expectedCurrentVersionId: requirement.currentVersion!.id,
        ruleId: selectedRuleId,
        ruleVersion: currentRule?.defaultVersion || 1,
        operator: operator ? (operator as RequirementOperator) : null,
        expectedValue: expectedValue.trim() || null,
        parameters,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to map compliance rule.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Map Controlled Compliance Rule</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase">Requirement</div>
            <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
              {requirement.identifier}: {requirement.currentVersion.title}
            </div>
            <div className="text-xs text-slate-600 mt-1 line-clamp-2">
              {requirement.currentVersion.description}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Rule Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Catalog Rule</span>
            </label>
            {isCatalogLoading ? (
              <div className="text-xs text-slate-500 py-4 text-center">Loading controlled rule catalog...</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                {catalog.map((rule) => {
                  const isSelected = rule.id === selectedRuleId;
                  return (
                    <div
                      key={rule.id}
                      onClick={() => handleSelectRule(rule)}
                      className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400 text-indigo-950"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">{rule.id}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {rule.category}
                        </Badge>
                      </div>
                      <div className="text-xs font-medium mt-0.5">{rule.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{rule.description}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Rule Parameters Form */}
          {currentRule && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evaluation Operator
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as RequirementOperator)}
                    className="w-full text-xs font-mono rounded-md border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {currentRule.supportedOperators.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Authoritative Expected Value / Threshold
                  </label>
                  <Input
                    placeholder="e.g. 10000000 or Active"
                    value={expectedValue}
                    onChange={(e) => setExpectedValue(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {currentRule.requiredParameters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Rule Parameters
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentRule.requiredParameters.map((param) => (
                      <div key={param.name}>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          {param.name} {param.required && <span className="text-rose-500">*</span>}
                        </label>
                        <Input
                          placeholder={param.description}
                          value={parameters[param.name] || ""}
                          onChange={(e) =>
                            setParameters({ ...parameters, [param.name]: e.target.value })
                          }
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Expected Evidence Type: </span>
                <code className="font-mono text-indigo-600 font-semibold">{currentRule.expectedEvidenceType}</code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" size="sm" onClick={onClose} disabled={mapRuleMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!selectedRuleId || mapRuleMutation.isPending}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Check className="w-4 h-4" />
            <span>{mapRuleMutation.isPending ? "Saving Rule..." : "Confirm & Map Rule"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
