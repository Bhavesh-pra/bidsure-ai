import React from 'react';

export const ErrorState: React.FC<{ title?: string; message?: string }> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Try again.'
}) => (
  <div className="p-6">
    <h3 className="text-lg font-semibold text-red-700">{title}</h3>
    <p className="text-sm text-slate-600">{message}</p>
  </div>
);

export default ErrorState;
