import React from 'react';

export const EmptyState: React.FC<{ title?: string; message?: string }> = ({
  title = 'Nothing here',
  message = 'No items to display.'
}) => (
  <div className="p-6 text-center text-slate-600">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm mt-1">{message}</p>
  </div>
);

export default EmptyState;
