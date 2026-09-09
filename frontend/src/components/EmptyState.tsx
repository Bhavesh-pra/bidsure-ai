import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are currently no items to display.',
  actionLabel,
  onAction,
}) => {
  return (
    <div style={{
      padding: '3rem 1.5rem',
      textAlign: 'center',
      border: '2px dashed #e2e8f0',
      borderRadius: '8px',
      color: '#718096',
      margin: '1rem 0'
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>{title}</h3>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3182ce',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
