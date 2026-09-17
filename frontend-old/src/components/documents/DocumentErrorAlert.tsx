import React from 'react';
import { AlertCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface DocumentErrorAlertProps {
  error: { code?: string; message?: string } | string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const DocumentErrorAlert: React.FC<DocumentErrorAlertProps> = ({
  error,
  onDismiss,
  onRetry,
  className = '',
}) => {
  if (!error) return null;

  const rawCode = typeof error === 'object' ? error.code : undefined;
  const rawMessage = typeof error === 'object' ? error.message : error;

  // Format human-friendly explanation based on backend error codes
  let title = 'Upload Failed';
  let message = rawMessage || 'An unexpected error occurred during document processing.';
  let isWarning = false;

  switch (rawCode) {
    case 'DOCUMENT_DUPLICATE':
      title = 'Duplicate Document Detected';
      message =
        'This exact document (matching SHA-256 checksum) has already been uploaded for this bid. Duplicate files are prevented to maintain data integrity.';
      isWarning = true;
      break;

    case 'FILE_TOO_LARGE':
      title = 'File Exceeds Size Limit';
      message = 'The uploaded file exceeds the 10 MB maximum size limit. Please compress or optimize the file and try again.';
      break;

    case 'INVALID_FILE_TYPE':
      title = 'Unsupported File Format';
      message = 'Only PDF, JPG, JPEG, and PNG files are accepted. Executables, archives, and other formats are strictly prohibited.';
      break;

    case 'INVALID_FILE_SIGNATURE':
      title = 'File Signature Mismatch';
      message = 'The file content does not match its declared extension (magic bytes mismatch). The file may be corrupt or misnamed.';
      break;

    case 'EMPTY_FILE':
      title = 'Empty File';
      message = 'The uploaded file contains 0 bytes. Please ensure the file is not empty.';
      break;

    case 'INVALID_DOCUMENT_TYPE':
      title = 'Invalid Document Type';
      message = 'The selected document type is not recognized. Please choose a valid document type from the list.';
      break;

    case 'FORBIDDEN':
      title = 'Permission Denied';
      message = 'You do not have permission to modify documents for this bid, or the bid belongs to another organization.';
      break;

    default:
      title = 'Document Error';
      break;
  }

  return (
    <div
      role="alert"
      className={`flex items-start justify-between rounded-lg border p-4 text-sm transition-all ${
        isWarning
          ? 'border-amber-300 bg-amber-50 text-amber-900'
          : 'border-red-200 bg-red-50 text-red-900'
      } ${className}`}
    >
      <div className="flex items-start space-x-3">
        {isWarning ? (
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
        )}
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-slate-700 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0 ml-3">
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="flex items-center space-x-1 text-xs text-slate-700 hover:text-slate-900"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </Button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded p-1 text-slate-400 hover:bg-black/5 hover:text-slate-700 transition-colors"
            title="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentErrorAlert;
