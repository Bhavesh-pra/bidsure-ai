import React, { useRef } from 'react';

export const FileDropzone: React.FC<{ file?: File; onFile: (file: File | undefined) => void; disabled?: boolean; error?: string }> = ({ file, onFile, disabled, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const choose = (event: React.ChangeEvent<HTMLInputElement>) => onFile(event.target.files?.[0]);
  const drop = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); if (!disabled) onFile(event.dataTransfer.files?.[0]); };
  return <div>
    <div role="button" tabIndex={disabled ? -1 : 0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === 'Enter') inputRef.current?.click(); }} onDragOver={(event) => event.preventDefault()} onDrop={drop} className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-50' : 'cursor-pointer border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
      <p className="text-sm font-medium text-slate-700">{file ? file.name : 'Select or drop a tender PDF'}</p>
      <p className="mt-1 text-xs text-slate-500">PDF files only, maximum 10 MB</p>
      <input ref={inputRef} className="hidden" type="file" accept="application/pdf,.pdf" disabled={disabled} onChange={choose} />
    </div>
    {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
  </div>;
};
