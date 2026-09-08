import React from 'react';

export const Loading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-6">
    <div className="text-sm text-slate-600">{message}</div>
  </div>
);

export default Loading;
