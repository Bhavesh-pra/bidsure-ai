import React from 'react';
import Spinner from '../ui/Spinner';

export const ProcessingSpinner: React.FC<{ label?: string }> = ({ label = 'Processing OCR…' }) => (
  <span className="inline-flex items-center gap-2 text-sm text-slate-600" role="status" aria-live="polite">
    <Spinner size={16} /> {label}
  </span>
);

export default ProcessingSpinner;
