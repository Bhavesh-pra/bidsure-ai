import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DocumentTypeSelect } from './DocumentTypeSelect';
import { UploadDropzone } from './UploadDropzone';
import { UploadProgress } from './UploadProgress';
import type { Document, DocumentType } from '../../types/document';
import { DOCUMENT_TYPE_LABELS, EXPECTED_BID_DOCUMENTS } from '../../types/document';
import { documentService } from '../../services/documentService';
import { FileUp, ListPlus, AlertTriangle } from 'lucide-react';

export interface MultiDocumentUploadModalProps {
  bidId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (uploadedDocument: Document) => void;
  initialDocumentType?: DocumentType | string;
}

interface BatchUploadItem {
  documentType: DocumentType;
  file: File | null;
  status: 'idle' | 'uploading' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
}

export const MultiDocumentUploadModal: React.FC<MultiDocumentUploadModalProps> = ({
  bidId,
  isOpen,
  onClose,
  onSuccess,
  initialDocumentType,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

  // Single Upload State
  const [singleType, setSingleType] = useState<string>(initialDocumentType || 'GST_CERTIFICATE');
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleDescription, setSingleDescription] = useState<string>('');
  const [singleProgress, setSingleProgress] = useState<number>(0);
  const [singleStatus, setSingleStatus] = useState<'idle' | 'uploading' | 'completed' | 'failed'>('idle');
  const [singleError, setSingleError] = useState<string | null>(null);

  // Batch Upload State
  const [batchItems, setBatchItems] = useState<BatchUploadItem[]>(() =>
    EXPECTED_BID_DOCUMENTS.map((type) => ({
      documentType: type,
      file: null,
      status: 'idle',
      progress: 0,
    }))
  );
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  // Sync initialDocumentType when prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialDocumentType) {
        setSingleType(initialDocumentType);
      }
      // Reset single upload state
      setSingleFile(null);
      setSingleDescription('');
      setSingleProgress(0);
      setSingleStatus('idle');
      setSingleError(null);

      // Reset batch state
      setBatchItems(
        EXPECTED_BID_DOCUMENTS.map((type) => ({
          documentType: type,
          file: null,
          status: 'idle',
          progress: 0,
        }))
      );
      setIsBatchUploading(false);
    }
  }, [isOpen, initialDocumentType]);

  // Handle single upload
  const handleSingleUpload = async () => {
    if (!singleFile) {
      setSingleError('Please select a file to upload.');
      return;
    }
    if (!singleType) {
      setSingleError('Please select a document type.');
      return;
    }

    setSingleError(null);
    setSingleStatus('uploading');
    setSingleProgress(0);

    try {
      const response = await documentService.uploadBidDocument({
        bidId,
        file: singleFile,
        documentType: singleType,
        description: singleDescription || undefined,
        onProgress: (percent) => {
          setSingleProgress(percent);
        },
      });

      setSingleStatus('completed');
      setSingleProgress(100);
      onSuccess(response.data);

      // Auto close after brief moment on success
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setSingleStatus('failed');
      const msg = err?.message || 'Upload failed. Please check file and try again.';
      setSingleError(msg);
    }
  };

  // Handle batch file selection for a specific row
  const handleBatchFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBatchItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        file,
        status: 'idle',
        progress: 0,
        errorMessage: undefined,
      };
      return copy;
    });
  };

  // Handle upload all batch items sequentially
  const handleBatchUploadAll = async () => {
    const itemsToUpload = batchItems.filter(
      (item) => item.file !== null && item.status !== 'completed'
    );
    if (itemsToUpload.length === 0) return;

    setIsBatchUploading(true);

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (!item.file || item.status === 'completed') continue;

      // Update item to uploading
      setBatchItems((prev) => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: 'uploading', progress: 0, errorMessage: undefined };
        return copy;
      });

      try {
        const response = await documentService.uploadBidDocument({
          bidId,
          file: item.file,
          documentType: item.documentType,
          onProgress: (pct) => {
            setBatchItems((prev) => {
              const copy = [...prev];
              copy[i] = { ...copy[i], progress: pct };
              return copy;
            });
          },
        });

        setBatchItems((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: 'completed', progress: 100 };
          return copy;
        });

        onSuccess(response.data);
      } catch (err: any) {
        setBatchItems((prev) => {
          const copy = [...prev];
          copy[i] = {
            ...copy[i],
            status: 'failed',
            errorMessage: err?.message || 'Upload failed',
          };
          return copy;
        });
      }
    }

    setIsBatchUploading(false);
  };

  const stagedBatchCount = batchItems.filter(
    (item) => item.file !== null && item.status !== 'completed'
  ).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Bidder Documents">
      <div className="space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'single'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileUp className="h-4 w-4" />
            <span>Single Document</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'batch'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListPlus className="h-4 w-4" />
            <span>Batch Checklist Upload</span>
          </button>
        </div>

        {/* SINGLE DOCUMENT TAB */}
        {activeTab === 'single' && (
          <div className="space-y-4 pt-1">
            <DocumentTypeSelect
              value={singleType}
              onChange={(val) => {
                setSingleType(val);
                setSingleError(null);
              }}
              disabled={singleStatus === 'uploading'}
            />

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Select File <span className="text-red-500">*</span>
              </label>
              <UploadDropzone
                file={singleFile}
                onFileSelect={(f) => {
                  setSingleFile(f);
                  setSingleError(null);
                }}
                disabled={singleStatus === 'uploading'}
                error={singleError || undefined}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Description <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={singleDescription}
                onChange={(e) => setSingleDescription(e.target.value)}
                placeholder="e.g. FY 2025-26 audited financial statement"
                disabled={singleStatus === 'uploading'}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {singleStatus !== 'idle' && (
              <UploadProgress
                progress={singleProgress}
                filename={singleFile?.name}
                status={singleStatus}
                errorMessage={singleError || undefined}
              />
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={singleStatus === 'uploading'}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSingleUpload}
                isLoading={singleStatus === 'uploading'}
                disabled={!singleFile || singleStatus === 'uploading'}
              >
                Upload Document
              </Button>
            </div>
          </div>
        )}

        {/* BATCH CHECKLIST TAB */}
        {activeTab === 'batch' && (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-slate-500">
              Select files for the required bid documents and upload all in one go. Supported formats:
              PDF, JPG, PNG (up to 10 MB per file).
            </p>

            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 max-h-[340px] overflow-y-auto">
              {batchItems.map((item, idx) => (
                <div key={item.documentType} className="p-3 space-y-1.5 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {DOCUMENT_TYPE_LABELS[item.documentType]}
                      </p>
                      {item.file && (
                        <p className="text-xs text-slate-500 truncate">{item.file.name}</p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      {item.status === 'completed' ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          ✓ Uploaded
                        </span>
                      ) : (
                        <label className="cursor-pointer rounded border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                          <span>{item.file ? 'Change' : 'Choose File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            disabled={isBatchUploading}
                            onChange={(e) => handleBatchFileSelect(idx, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {item.status === 'uploading' && (
                    <UploadProgress
                      progress={item.progress}
                      status="uploading"
                      filename={item.file?.name}
                    />
                  )}

                  {item.status === 'failed' && (
                    <div className="flex items-center text-xs text-red-600 space-x-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.errorMessage || 'Upload failed'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {stagedBatchCount} file(s) ready to upload
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  disabled={isBatchUploading}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleBatchUploadAll}
                  isLoading={isBatchUploading}
                  disabled={stagedBatchCount === 0 || isBatchUploading}
                >
                  Upload All ({stagedBatchCount})
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MultiDocumentUploadModal;
