import React from 'react';
import type { Requirement } from '../../types';
import type { ComplianceRule } from '../../types/rule';
import { RuleBadge } from './RuleBadge';
import { RuleTypeBadge } from './RuleTypeBadge';
import { OperatorDisplay } from './OperatorDisplay';
import { ExpectedValueDisplay } from './ExpectedValueDisplay';

export const RequirementRuleRow: React.FC<{ requirement: Requirement; rule?: ComplianceRule; onSelect?: () => void }> = ({ requirement, rule, onSelect }) => <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm"><div className="min-w-[180px] flex-1"><p className="font-medium text-slate-900">{requirement.title}</p><p className="text-xs text-slate-500">{requirement.category}</p></div>{rule ? <><RuleTypeBadge type={rule.rule_type} /><OperatorDisplay operator={rule.operator} /><ExpectedValueDisplay value={rule.expected_value} unit={rule.parameters?.unit} /></> : <RuleBadge configured={false} />} {rule && <RuleBadge configured={rule.enabled} />} {onSelect && <button type="button" className="text-indigo-600 hover:text-indigo-800" onClick={onSelect}>View Rule</button>}</div>;
