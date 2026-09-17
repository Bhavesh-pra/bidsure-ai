import React from 'react';
import { FormField } from './FormField';

export interface DateTimeFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({ label, error, hint, required, id, ...props }) => (
  <FormField id={id} label={label} error={error} hint={hint} required={required}>
    <input id={id} type="datetime-local" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100" {...props} />
  </FormField>
);
