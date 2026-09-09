import React from 'react';
import { Badge } from '../ui/Badge';

export const ExtractionStatus: React.FC<{ status?: string | null }> = ({ status }) => {
  const normalized = (status || 'UNKNOWN').toUpperCase();
  const config: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral' }> = { EXTRACTED: { label: '✓ Extracted', variant: 'success' }, EXTRACTING: { label: '⟳ Extracting', variant: 'info' }, EXTRACTION_FAILED: { label: '✕ Extraction Failed', variant: 'danger' }, REVIEW_REQUIRED: { label: '⚠ Review Required', variant: 'warning' } };
  const item = config[normalized] || { label: normalized.replace(/_/g, ' '), variant: 'neutral' as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
};

export default ExtractionStatus;
