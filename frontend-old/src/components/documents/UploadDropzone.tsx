import React, { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ACCEPT_ATTRIBUTE = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export interface UploadDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  file,
  onFileSelect,
  disabled = false,
  error: externalError,
  className = '',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (selectedFile?: File) => {
    setInternalError(null);
    if (!selectedFile) {
      onFileSelect(null);
      return;
    }

    // Check extension
    const name = selectedFile.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
    if (!hasValidExt) {
      setInternalError('Only PDF, JPG, JPEG, and PNG files are accepted.');
      onFileSelect(null);
      return;
    }

    // Check size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setInternalError('File exceeds the maximum allowed size of 10 MB.');
      onFileSelect(null);
      return;
    }

    if (selectedFile.size === 0) {
      setInternalError('The selected file is empty.');
      onFileSelect(null);
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSelect(droppedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosenFile = e.target.files?.[0];
    validateAndSelect(chosenFile);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isImage = file?.name.toLowerCase().match(/\.(jpg|jpeg|png)$/);
  const activeError = externalError || internalError;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {file ? (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onFileSelect(null);
              setInternalError(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            disabled={disabled}
            className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50"
            title="Remove file"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all ${
            disabled
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              : dragOver
              ? 'border-indigo-500 bg-indigo-50/40 cursor-pointer'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF, JPG, JPEG, or PNG (up to 10 MB)
          </p>
        </div>
      )}

      {activeError && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {activeError}
        </p>
      )}
    </div>
  );
};

export default UploadDropzone;
