import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label ? <label className="text-xs font-semibold text-slate-700 mb-1.5">{label}</label> : null}
      <input
        className="px-3.5 py-2 border border-slate-300 rounded-[6px] bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all shadow-2xs"
        {...props}
      />
      {error ? <span className="text-xs text-[#B91C1C] mt-1 font-medium">{error}</span> : null}
    </div>
  );
};

export default Input;
