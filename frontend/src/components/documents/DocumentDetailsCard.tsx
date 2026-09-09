import React from 'react';
import type { Document } from '../../types/document';
import { DocumentTypeBadge } from './DocumentTypeBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ClassificationStatus } from './ClassificationStatus';
import { ProcessingBadge } from './ProcessingBadge';

export const DocumentDetailsCard: React.FC<{ document: Document }> = ({ document }) => {
  const classifiedType = document.classified_document_type || (document.classification_status === 'CLASSIFIED' ? document.document_type : 'UNKNOWN');
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-900">{document.original_filename}</h3><ProcessingBadge status={document.processing_status} /></div><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs uppercase text-slate-500">Type</dt><dd className="mt-1"><DocumentTypeBadge type={classifiedType} /></dd></div><div><dt className="text-xs uppercase text-slate-500">Confidence</dt><dd className="mt-1"><ConfidenceBadge confidence={document.classification_confidence} /></dd></div><div><dt className="text-xs uppercase text-slate-500">OCR</dt><dd className="mt-1"><ProcessingBadge status={document.processing_status} /></dd></div><div><dt className="text-xs uppercase text-slate-500">Classification</dt><dd className="mt-1"><ClassificationStatus status={document.classification_status} /></dd></div></dl>{document.classification_status === 'REVIEW_REQUIRED' && <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">Classification uncertain. Manual review required.</p>}</div>;
};

export default DocumentDetailsCard;
