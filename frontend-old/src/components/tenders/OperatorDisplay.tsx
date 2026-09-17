import React from 'react';

const labels: Record<string, string> = { GREATER_THAN_EQUAL: '≥', LESS_THAN_EQUAL: '≤', GREATER_THAN: '>', LESS_THAN: '<', EQUALS: '==', EXISTS: 'exists' };
export const OperatorDisplay: React.FC<{ operator?: string }> = ({ operator }) => <span className="font-mono font-semibold text-slate-900">{operator ? labels[operator] || operator : '—'}</span>;
