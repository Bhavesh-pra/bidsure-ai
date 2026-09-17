import React from 'react';

export interface UploadProgressProps {
  progress: number;
  filename?: string;
  status?: 'uploading' | 'completed' | 'failed';
  errorMessage?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  filename,
  status = 'uploading',
  errorMessage,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-slate-700 truncate max-w-[240px]">
          {filename || 'Uploading document...'}
        </span>
        <span className="text-xs font-semibold text-slate-500">
          {status === 'completed'
            ? '✓ Uploaded'
            : status === 'failed'
            ? '✕ Failed'
            : `${progress}%`}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full transition-all duration-200 ${
            status === 'completed'
              ? 'bg-emerald-500'
              : status === 'failed'
              ? 'bg-red-500'
              : 'bg-indigo-600'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {status === 'failed' && errorMessage && (
        <p className="mt-1.5 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
};

export default UploadProgress;
