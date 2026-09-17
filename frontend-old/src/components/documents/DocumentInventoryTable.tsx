import React from 'react';
import type { Document } from '../../types/document';
import { DocumentTypeBadge } from './DocumentTypeBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ClassificationStatus } from './ClassificationStatus';

export const DocumentInventoryTable: React.FC<{ documents: Document[]; onSelect?: (document: Document) => void }> = ({ documents, onSelect }) => <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left font-medium text-slate-500">Document</th><th className="px-4 py-3 text-left font-medium text-slate-500">Type</th><th className="px-4 py-3 text-left font-medium text-slate-500">Confidence</th><th className="px-4 py-3 text-left font-medium text-slate-500">Status</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{documents.map((document) => <tr key={document.id} className={onSelect ? 'cursor-pointer hover:bg-slate-50' : ''} onClick={() => onSelect?.(document)}><td className="px-4 py-3 font-medium text-slate-800">{document.original_filename}</td><td className="px-4 py-3"><DocumentTypeBadge type={document.classified_document_type || (document.classification_status === 'CLASSIFIED' ? document.document_type : 'UNKNOWN')} /></td><td className="px-4 py-3"><ConfidenceBadge confidence={document.classification_confidence} /></td><td className="px-4 py-3"><ClassificationStatus status={document.classification_status} /></td></tr>)}</tbody></table></div>;

export default DocumentInventoryTable;
