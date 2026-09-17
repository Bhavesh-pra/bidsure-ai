import React from 'react';
import { Card } from '../ui/Card';
import type { ComplianceRule } from '../../types/rule';
import { RuleStatus } from './RuleStatus';
import { RuleTypeBadge } from './RuleTypeBadge';
import { OperatorDisplay } from './OperatorDisplay';
import { ExpectedValueDisplay } from './ExpectedValueDisplay';

export const RuleDetailsCard: React.FC<{ rule: ComplianceRule }> = ({ rule }) => <Card title="Rule details" subtitle={`Rule version ${rule.version}`}><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs uppercase text-slate-500">Rule Type</dt><dd className="mt-1"><RuleTypeBadge type={rule.rule_type} /></dd></div><div><dt className="text-xs uppercase text-slate-500">Status</dt><dd className="mt-1"><RuleStatus enabled={rule.enabled} /></dd></div><div><dt className="text-xs uppercase text-slate-500">Operator</dt><dd className="mt-1"><OperatorDisplay operator={rule.operator} /></dd></div><div><dt className="text-xs uppercase text-slate-500">Expected Value</dt><dd className="mt-1"><ExpectedValueDisplay value={rule.expected_value} unit={rule.parameters?.unit} /></dd></div><div><dt className="text-xs uppercase text-slate-500">Priority</dt><dd className="mt-1">{rule.priority}</dd></div><div><dt className="text-xs uppercase text-slate-500">Rule ID</dt><dd className="mt-1 font-mono text-xs">{rule.id}</dd></div></dl></Card>;
