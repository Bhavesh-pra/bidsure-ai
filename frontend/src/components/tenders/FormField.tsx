import React from 'react';

export interface FormFieldProps {
  id?: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

/** Shared field shell. It owns labels and accessible error/help text, not field state. */
export const FormField: React.FC<FormFieldProps> = ({ id, label, error, hint, required, children }) => {
  const messageId = error ? `${id ?? label}-error` : hint ? `${id ?? label}-hint` : undefined;
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="mb-1 text-sm text-slate-700">
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      {React.isValidElement(children) ? React.cloneElement(children, {
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': messageId,
      } as Record<string, unknown>) : children}
      {error ? <p id={messageId} className="mt-1 text-xs text-red-600" role="alert">{error}</p> : hint ? <p id={messageId} className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
};
