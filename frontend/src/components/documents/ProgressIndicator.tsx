import React from 'react';

export const ProgressIndicator: React.FC<{ progress?: number; currentPage?: number; pageCount?: number }> = ({ progress = 0, currentPage, pageCount }) => {
  const value = Math.max(0, Math.min(100, progress));
  return <div className="space-y-1.5" aria-label="OCR progress"><div className="flex justify-between text-xs text-slate-500"><span>{currentPage && pageCount ? `Page ${currentPage} of ${pageCount}` : 'OCR processing'}</span><span>{Math.round(value)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${value}%` }} /></div></div>;
};

export default ProgressIndicator;
