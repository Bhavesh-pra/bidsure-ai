import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <div className={`rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] ${className}`}>
      {(title || action || subtitle) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            {title && <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
