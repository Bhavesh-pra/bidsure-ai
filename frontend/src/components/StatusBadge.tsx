import React from 'react';

export type BadgeStatus = 
  | 'PASS'
  | 'FAIL'
  | 'REVIEW'
  | 'REVIEW_REQUIRED'
  | 'PENDING'
  | 'PROCESSING'
  | 'VERIFIED'
  | 'VERIFIED_FAIL'
  | 'UNABLE_TO_VERIFY'
  | 'ACCEPT'
  | 'REJECT'
  | 'PUBLISHED'
  | 'DRAFT';

interface StatusBadgeProps {
  status: BadgeStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColors = (s: string) => {
    switch (s.toUpperCase()) {
      case 'PASS':
      case 'VERIFIED':
      case 'ACCEPT':
      case 'PUBLISHED':
        return { bg: '#c6f6d5', color: '#22543d', border: '#9ae6b4' };
      case 'FAIL':
      case 'VERIFIED_FAIL':
      case 'REJECT':
        return { bg: '#fed7d7', color: '#742a2a', border: '#feb2b2' };
      case 'REVIEW':
      case 'REVIEW_REQUIRED':
      case 'PENDING':
        return { bg: '#feebc8', color: '#744210', border: '#fbd38d' };
      case 'PROCESSING':
      case 'UNABLE_TO_VERIFY':
        return { bg: '#e2e8f0', color: '#2d3748', border: '#cbd5e0' };
      default:
        return { bg: '#edf2f7', color: '#4a5568', border: '#cbd5e0' };
    }
  };

  const styleConfig = getColors(status);

  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.6rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      borderRadius: '9999px',
      backgroundColor: styleConfig.bg,
      color: styleConfig.color,
      border: `1px solid ${styleConfig.border}`,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {status}
    </span>
  );
};

export default StatusBadge;
