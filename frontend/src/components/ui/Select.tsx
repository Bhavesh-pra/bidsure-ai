import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label ? <label className="text-xs font-semibold text-slate-700 mb-1.5">{label}</label> : null}
      <select
        className="px-3.5 py-2 border border-slate-300 rounded-[6px] bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all shadow-2xs cursor-pointer"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
