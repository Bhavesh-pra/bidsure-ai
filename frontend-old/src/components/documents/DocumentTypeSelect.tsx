import React from 'react';
import { DOCUMENT_TYPE_LABELS, DocumentType } from '../../types/document';

export interface DocumentTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({
  value,
  onChange,
  label = 'Document Type',
  error,
  disabled = false,
  className = '',
  required = true,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-red-300 focus:ring-red-200'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
      >
        <option value="" disabled>
          Select Document Type...
        </option>
        {Object.entries(DOCUMENT_TYPE_LABELS).map(([typeKey, typeLabel]) => (
          <option key={typeKey} value={typeKey}>
            {typeLabel}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default DocumentTypeSelect;
