import React from 'react';
import { FileText, Image as ImageIcon, Eye, Trash2 } from 'lucide-react';
import type { Document, DocumentType } from '../../types/document';
import { DOCUMENT_TYPE_LABELS } from '../../types/document';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { Button } from '../ui/Button';
import { ProcessingSpinner } from './ProcessingSpinner';
import { DocumentTypeBadge } from './DocumentTypeBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ClassificationStatus } from './ClassificationStatus';

export interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  isDeleting?: boolean;
  onProcess?: (document: Document) => void;
  isProcessing?: boolean;
  onViewOCR?: (document: Document) => void;
  onClassify?: (document: Document) => void;
  isClassifying?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDelete,
  isDeleting = false,
  onProcess,
  isProcessing = false,
  onViewOCR,
  onClassify,
  isClassifying = false,
}) => {
  const typeLabel =
    DOCUMENT_TYPE_LABELS[document.document_type as DocumentType] ||
    document.document_type.replace(/_/g, ' ');

  const isImage = (document.mime_type || '').startsWith('image/');

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow">
      <div>
        {/* Top bar: Document Type Title and Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{typeLabel}</h4>
              <p className="text-xs text-slate-500 truncate max-w-[200px]" title={document.original_filename}>
                {document.original_filename}
              </p>
            </div>
          </div>
          <DocumentStatusBadge status={document.processing_status} />
        </div>

        {/* Metadata Details */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div>
            <span className="text-slate-400 block">File Size</span>
            <span className="font-medium text-slate-700">{formatSize(document.size_bytes)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Uploaded</span>
            <span className="font-medium text-slate-700">{formatDate(document.created_at)}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <DocumentTypeBadge type={document.classified_document_type || (document.classification_status === 'CLASSIFIED' ? document.document_type : 'UNKNOWN')} />
          <ConfidenceBadge confidence={document.classification_confidence} />
          <ClassificationStatus status={document.classification_status} />
        </div>

        {document.description && (
          <p className="mt-2.5 text-xs text-slate-500 italic line-clamp-2">
            "{document.description}"
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
        {onProcess && (document.processing_status === 'UPLOADED' || document.processing_status === 'FAILED' || document.processing_status === 'INVALID') && (
          <Button variant="secondary" size="sm" onClick={() => onProcess(document)} disabled={isProcessing}>
            {isProcessing ? <ProcessingSpinner label="Processing…" /> : 'Process OCR'}
          </Button>
        )}
        {onView && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(document)}
            className="flex items-center space-x-1"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </Button>
        )}
        {onViewOCR && document.processing_status === 'PROCESSED' && (
          <Button variant="outline" size="sm" onClick={() => onViewOCR(document)}>View OCR</Button>
        )}
        {onClassify && document.processing_status === 'PROCESSED' && (!document.classification_status || document.classification_status === 'UNKNOWN' || document.classification_status === 'FAILED') && (
          <Button variant="secondary" size="sm" onClick={() => onClassify(document)} disabled={isClassifying}>{isClassifying ? 'Classifying…' : 'Classify'}</Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(document)}
            isLoading={isDeleting}
            disabled={isDeleting}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            <span>Delete</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
