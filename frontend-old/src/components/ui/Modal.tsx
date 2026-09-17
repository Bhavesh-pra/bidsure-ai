import React from 'react';
import { X } from 'lucide-react';

export const Modal: React.FC<{ isOpen: boolean; title?: string; onClose: () => void; children?: React.ReactNode }> = ({
  isOpen,
  title,
  onClose,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-[10px] border border-slate-200 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.15)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
