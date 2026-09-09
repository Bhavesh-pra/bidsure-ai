import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import type { Document, DocumentType } from '../../types/document';
import { DOCUMENT_TYPE_LABELS } from '../../types/document';

export interface DocumentMetadataModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentMetadataModal: React.FC<DocumentMetadataModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  if (!document) return null;

  const typeLabel =
    DOCUMENT_TYPE_LABELS[document.document_type as DocumentType] ||
    document.document_type.replace(/_/g, ' ');

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB (${bytes.toLocaleString()} bytes)`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${bytes.toLocaleString()} bytes)`;
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Metadata">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-semibold text-slate-800">{typeLabel}</h4>
            <p className="text-xs text-slate-500">{document.original_filename}</p>
          </div>
          <DocumentStatusBadge status={document.processing_status} />
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="rounded-md bg-slate-50 p-2.5">
            <dt className="text-xs font-medium text-slate-500">Document ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-slate-800 break-all">{document.id}</dd>
          </div>

          <div className="rounded-md bg-slate-50 p-2.5">
            <dt className="text-xs font-medium text-slate-500">Document Type</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{document.document_type}</dd>
          </div>

          <div className="rounded-md bg-slate-50 p-2.5">
            <dt className="text-xs font-medium text-slate-500">MIME Type</dt>
            <dd className="mt-0.5 font-mono text-xs text-slate-800">{document.mime_type}</dd>
          </div>

          <div className="rounded-md bg-slate-50 p-2.5">
            <dt className="text-xs font-medium text-slate-500">File Size</dt>
            <dd className="mt-0.5 text-xs text-slate-800">{formatSize(document.size_bytes)}</dd>
          </div>

          <div className="rounded-md bg-slate-50 p-2.5 sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500">SHA-256 Checksum</dt>
            <dd className="mt-0.5 font-mono text-xs text-slate-800 break-all bg-white p-1.5 rounded border border-slate-200 select-all">
              {document.sha256}
            </dd>
          </div>

          <div className="rounded-md bg-slate-50 p-2.5">
            <dt className="text-xs font-medium text-slate-500">Uploaded At</dt>
            <dd className="mt-0.5 text-xs text-slate-800">{formatDate(document.created_at)}</dd>
          </div>

          {document.bid_id && (
            <div className="rounded-md bg-slate-50 p-2.5">
              <dt className="text-xs font-medium text-slate-500">Bid ID</dt>
              <dd className="mt-0.5 font-mono text-xs text-slate-800">{document.bid_id}</dd>
            </div>
          )}

          {document.description && (
            <div className="rounded-md bg-slate-50 p-2.5 sm:col-span-2">
              <dt className="text-xs font-medium text-slate-500">Description</dt>
              <dd className="mt-0.5 text-xs text-slate-700">{document.description}</dd>
            </div>
          )}
        </dl>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentMetadataModal;
