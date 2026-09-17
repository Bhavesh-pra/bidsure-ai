import React from 'react';
import { ProcessingBadge } from './ProcessingBadge';
import { ProcessingSpinner } from './ProcessingSpinner';
import { ProgressIndicator } from './ProgressIndicator';

export const DocumentStatus: React.FC<{ status: string; progress?: number; currentPage?: number; pageCount?: number; error?: string }> = ({ status, progress, currentPage, pageCount, error }) => (
  <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><ProcessingBadge status={status} />{status === 'PROCESSING' && <ProcessingSpinner />}</div>{status === 'PROCESSING' && <ProgressIndicator progress={progress} currentPage={currentPage} pageCount={pageCount} />}{(status === 'FAILED' || status === 'INVALID') && error && <p className="text-xs text-red-700" role="alert">{error}</p>}</div>
);

export default DocumentStatus;
