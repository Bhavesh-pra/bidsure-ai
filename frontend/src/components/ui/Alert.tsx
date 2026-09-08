import React from 'react';

export const Alert: React.FC<{ variant?: 'info' | 'success' | 'warning' | 'danger'; children?: React.ReactNode }> = ({
  variant = 'info',
  children,
}) => {
  const styles: Record<string, string> = {
    info: 'bg-blue-50 text-blue-800 border border-blue-100',
    success: 'bg-green-50 text-green-800 border border-green-100',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-100',
    danger: 'bg-red-50 text-red-800 border border-red-100',
  };
  return <div className={`p-3 rounded-md text-sm ${styles[variant]}`}>{children}</div>;
};

export default Alert;
