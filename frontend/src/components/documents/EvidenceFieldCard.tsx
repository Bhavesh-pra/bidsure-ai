import React from 'react';
import type { Evidence } from '../../types';
import { ConfidenceLevelBadge } from './ConfidenceLevelBadge';

export const EvidenceFieldCard: React.FC<{ evidence: Evidence; onViewSource?: (evidence: Evidence) => void }> = ({ evidence, onViewSource }) => <article className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-slate-500">{evidence.field.replace(/_/g, ' ')}</p><p className="mt-1 break-words font-medium text-slate-900">{String(evidence.normalized_value ?? evidence.value)}</p></div><ConfidenceLevelBadge confidence={evidence.confidence} /></div><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Page {evidence.page ?? '—'} · {evidence.extraction_method || 'EXTRACTION'}</span>{onViewSource && <button className="font-medium text-indigo-600 hover:underline" onClick={() => onViewSource(evidence)}>View Source</button>}</div></article>;

export default EvidenceFieldCard;
