import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-[6px] shadow-xs cursor-pointer';

  const variants = {
    primary: 'bg-[#0F2747] text-white hover:bg-[#183B63] active:bg-[#0A1B33] focus:ring-[#0F2747]',
    secondary: 'bg-[#0F766E] text-white hover:bg-[#115E59] active:bg-[#0F514C] focus:ring-[#0F766E]',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 focus:ring-slate-400',
    danger: 'bg-[#B91C1C] text-white hover:bg-[#991B1B] active:bg-[#7F1D1D] focus:ring-[#B91C1C]',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 focus:ring-slate-300 shadow-none',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
