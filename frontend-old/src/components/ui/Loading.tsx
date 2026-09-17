import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading: React.FC<{ message?: string }> = ({ message = 'Loading compliance data...' }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center py-10">
    <Loader2 className="h-7 w-7 animate-spin text-[#0F766E] mb-2" />
    <p className="text-xs font-medium text-slate-600">{message}</p>
  </div>
);

export default Loading;
