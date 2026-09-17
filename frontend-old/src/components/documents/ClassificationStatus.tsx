import React from 'react';
import { Badge } from '../ui/Badge';

export const ClassificationStatus: React.FC<{ status?: string | null }> = ({ status }) => {
  const normalized = (status || 'UNKNOWN').toUpperCase();
  const states: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral' }> = {
    CLASSIFIED: { label: '✓ Classified', variant: 'success' },
    REVIEW_REQUIRED: { label: '⚠ Review Required', variant: 'warning' },
    UNKNOWN: { label: '⚠ Unknown', variant: 'warning' },
    PROCESSING: { label: '⟳ Processing', variant: 'info' },
    FAILED: { label: '✕ Failed', variant: 'danger' },
  };
  const state = states[normalized] || states.UNKNOWN;
  return <Badge variant={state.variant}>{state.label}</Badge>;
};

export default ClassificationStatus;
