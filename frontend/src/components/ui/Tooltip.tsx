import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  title?: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, title, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className={`relative inline-flex items-center gap-1 cursor-help ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      aria-label="More information"
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-[#0F766E] transition-colors" />}

      {isVisible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-[6px] bg-[#0F2747] text-white p-2.5 shadow-xl text-[11px] leading-relaxed z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          {title && <span className="font-bold text-[#14B8A6] block mb-0.5">{title}</span>}
          <span>{content}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F2747]" />
        </span>
      )}
    </span>
  );
};

export default Tooltip;
