import React from 'react';

export const UploadProgress: React.FC<{ progress: number }> = ({ progress }) => <div className="mt-3" aria-label={`Upload progress ${progress}%`}><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-right text-xs text-slate-500">{progress}%</p></div>;
