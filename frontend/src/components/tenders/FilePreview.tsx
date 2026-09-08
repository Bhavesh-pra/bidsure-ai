import React from 'react';

export const FilePreview: React.FC<{ file?: File }> = ({ file }) => file ? <div className="mt-3 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"><span className="truncate text-slate-700">{file.name}</span><span className="ml-3 whitespace-nowrap text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span></div> : null;
