import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label ? <label className="text-sm text-slate-700 mb-1">{label}</label> : null}
      <input
        className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        {...props}
      />
      {error ? <span className="text-xs text-red-600 mt-1">{error}</span> : null}
    </div>
  );
};

export default Input;
