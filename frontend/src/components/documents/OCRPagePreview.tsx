import React from 'react';
import type { OCRPage } from '../../types/document';

export const OCRPagePreview: React.FC<{ pages: OCRPage[]; emptyMessage?: string }> = ({ pages, emptyMessage = 'No raw OCR text is available yet.' }) => {
  if (!pages.length) return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  return <div className="space-y-4">{pages.map((page) => <article key={page.page_number} className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="mb-2 flex items-center justify-between"><h4 className="font-semibold text-slate-800">Page {page.page_number}</h4>{page.ocr_confidence != null && <span className="text-xs text-slate-500">OCR confidence: {Math.round(page.ocr_confidence * 100)}%</span>}</div><pre className="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{page.text || '(No text detected)'}</pre></article>)}</div>;
};

export default OCRPagePreview;
