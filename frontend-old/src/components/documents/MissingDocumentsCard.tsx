import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Upload } from 'lucide-react';
import type { Document, DocumentType } from '../../types/document';
import { DOCUMENT_TYPE_LABELS, EXPECTED_BID_DOCUMENTS } from '../../types/document';
import { Button } from '../ui/Button';

export interface MissingDocumentsCardProps {
  documents: Document[];
  onUploadForType?: (type: DocumentType) => void;
  onOpenUploadModal?: () => void;
}

export const MissingDocumentsCard: React.FC<MissingDocumentsCardProps> = ({
  documents,
  onUploadForType,
  onOpenUploadModal,
}) => {
  // Map uploaded documents by document_type
  const uploadedTypesMap = new Map<string, Document[]>();
  documents.forEach((doc) => {
    const existing = uploadedTypesMap.get(doc.document_type) || [];
    existing.push(doc);
    uploadedTypesMap.set(doc.document_type, existing);
  });

  const uploadedCount = EXPECTED_BID_DOCUMENTS.filter((type) =>
    uploadedTypesMap.has(type)
  ).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Expected Bid Documents Checklist
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {uploadedCount} of {EXPECTED_BID_DOCUMENTS.length} standard documents uploaded
          </p>
        </div>
        {onOpenUploadModal && (
          <Button size="sm" onClick={onOpenUploadModal} className="flex items-center space-x-1.5">
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        )}
      </div>

      {/* Cycle 7 Boundary & Compliance Disclaimer */}
      <div className="my-3 flex items-start space-x-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-800">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-semibold">Document Ingestion Tracking:</span>{' '}
          Documents marked as <span className="font-medium text-amber-900">"Missing"</span> have
          not been uploaded yet. This checklist tracks document availability only and does not
          evaluate bidder compliance or eligibility.
        </div>
      </div>

      {/* Expected Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {EXPECTED_BID_DOCUMENTS.map((type) => {
          const matchingDocs = uploadedTypesMap.get(type);
          const isUploaded = Boolean(matchingDocs && matchingDocs.length > 0);
          const label = DOCUMENT_TYPE_LABELS[type];

          return (
            <div
              key={type}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                isUploaded
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                  : 'border-slate-200 bg-slate-50/60 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                {isUploaded ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  <p className="text-[11px] text-slate-500">
                    {isUploaded
                      ? `${matchingDocs!.length} uploaded (${matchingDocs![0].original_filename})`
                      : 'Not uploaded'}
                  </p>
                </div>
              </div>

              {!isUploaded && onUploadForType && (
                <button
                  type="button"
                  onClick={() => onUploadForType(type)}
                  className="shrink-0 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                  title={`Upload ${label}`}
                >
                  Upload
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissingDocumentsCard;
