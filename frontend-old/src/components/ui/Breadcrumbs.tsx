import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-1.5 text-xs text-slate-500 ${className}`} aria-label="Breadcrumb">
      <Link to="/dashboard" className="flex items-center hover:text-[#0F2747] transition-colors">
        <Home className="h-3.5 w-3.5 shrink-0" />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const linkTarget = item.path || item.href;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {isLast || !linkTarget ? (
              <span className="font-semibold text-[#0F2747] truncate max-w-[200px]" title={item.label}>
                {item.label}
              </span>
            ) : (
              <Link to={linkTarget} className="hover:text-[#0F2747] transition-colors truncate max-w-[150px]" title={item.label}>
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
