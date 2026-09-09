import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const styles = {
    default: 'bg-[#F0F4F8] text-[#0F2747] border-[#CBD5E1]',
    neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    success: 'bg-[#ECFDF3] text-[#15803D] border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    danger: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
    info: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-xs font-semibold tracking-wide ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
