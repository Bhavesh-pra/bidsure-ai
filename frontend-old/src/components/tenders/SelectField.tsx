import React from 'react';
import { FormField } from './FormField';

export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, options, error, hint, required, placeholder = 'Select an option', id, ...props }) => (
  <FormField id={id} label={label} error={error} hint={hint} required={required}>
    <select id={id} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100" {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
  </FormField>
);
