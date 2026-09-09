import React from 'react';
import { AlertOctagon } from 'lucide-react';

export const ErrorState: React.FC<{ title?: string; message?: string; action?: React.ReactNode }> = ({
  title = 'Service Unavailable',
  message = 'An error occurred while communicating with the verification service.',
  action,
}) => (
  <div className="flex items-start gap-3.5 p-4 rounded-[6px] bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C]">
    <AlertOctagon className="h-5 w-5 shrink-0 mt-0.5 text-[#B91C1C]" />
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-[#991B1B] mt-0.5">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  </div>
);

export default ErrorState;
