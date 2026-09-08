import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label ? <label className="text-sm text-slate-700 mb-1">{label}</label> : null}
      <select className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" {...props}>
        {children}
      </select>
    </div>
  );
};

export default Select;
