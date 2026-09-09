import React from 'react';
import { Badge } from '../ui/Badge';

export type ProcessingState = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'INVALID' | string;

export const ProcessingBadge: React.FC<{ status: ProcessingState }> = ({ status }) => {
  const normalized = (status || 'UNKNOWN').toUpperCase();
  const config: Record<string, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }> = {
    UPLOADED: { label: 'Uploaded', variant: 'neutral' },
    PROCESSING: { label: 'Processing OCR', variant: 'info' },
    PROCESSED: { label: 'Ready', variant: 'success' },
    FAILED: { label: 'Processing failed', variant: 'danger' },
    INVALID: { label: 'Invalid document', variant: 'danger' },
  };
  const item = config[normalized] || { label: normalized.replace(/_/g, ' '), variant: 'neutral' as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
};

export default ProcessingBadge;
