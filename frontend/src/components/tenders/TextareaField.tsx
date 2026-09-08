import React from 'react';
import { FormField } from './FormField';

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({ label, error, hint, required, id, className = '', ...props }) => (
  <FormField id={id} label={label} error={error} hint={hint} required={required}>
    <textarea id={id} className={`min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 ${className}`} {...props} />
  </FormField>
);
