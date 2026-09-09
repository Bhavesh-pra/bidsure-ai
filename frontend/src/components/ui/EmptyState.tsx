import React from 'react';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  message = 'There are no active items available for this view.',
  action,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-8 py-12 text-center rounded-[8px] border border-dashed border-slate-200 bg-slate-50/50">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#0F2747] mb-3 border border-slate-200">
      {icon || <FolderOpen className="h-6 w-6 text-slate-500" />}
    </div>
    <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>
    <p className="mt-1 text-xs text-slate-500 max-w-md">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
