import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}) => {
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#fff5f5',
      border: '1px solid #feb2b2',
      borderRadius: '6px',
      color: '#c53030',
      textAlign: 'center',
      margin: '1rem 0'
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#e53e3e',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;
