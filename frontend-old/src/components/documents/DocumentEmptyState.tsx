import React from 'react';
import { FileUp, FileCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export interface DocumentEmptyStateProps {
  onUploadClick?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export const DocumentEmptyState: React.FC<DocumentEmptyStateProps> = ({
  onUploadClick,
  title = 'No documents uploaded',
  description = 'No bidder documents have been uploaded for this bid yet. Upload required certificates and specifications to track document availability.',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3.5 shadow-sm">
        <FileCheck className="h-7 w-7" />
      </div>

      <h3 className="text-base font-semibold text-slate-800">{title}</h3>

      <p className="mt-1 text-xs text-slate-500 max-w-md leading-relaxed">{description}</p>

      {onUploadClick && (
        <div className="mt-5">
          <Button
            size="sm"
            onClick={onUploadClick}
            className="flex items-center space-x-1.5 shadow-sm"
          >
            <FileUp className="h-4 w-4" />
            <span>Upload First Document</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentEmptyState;
