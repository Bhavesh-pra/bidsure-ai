import React from 'react';
import { Alert } from '../ui/Alert';

export const ErrorMessage: React.FC<{ message?: string; onRetry?: () => void }> = ({ message = 'Document processing failed. Please try again.', onRetry }) => <Alert variant="danger"><div className="flex items-center justify-between gap-3"><span>{message}</span>{onRetry && <button className="font-medium underline" onClick={onRetry}>Retry</button>}</div></Alert>;

export default ErrorMessage;
