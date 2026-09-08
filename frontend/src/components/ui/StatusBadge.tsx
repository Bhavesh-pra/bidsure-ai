import React from 'react';
import { VerificationStatus } from '../../types';
import { Badge } from './Badge';

export interface StatusBadgeProps {
  status: VerificationStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'VERIFIED_PASS':
    case 'PASS':
    case 'QUALIFIED':
      return <Badge variant="success">✓ {status.replace('_', ' ')}</Badge>;

    case 'VERIFIED_FAIL':
    case 'FAIL':
    case 'DISQUALIFIED':
      return <Badge variant="danger">✕ {status.replace('_', ' ')}</Badge>;

    case 'REVIEW_REQUIRED':
    case 'REVIEW':
    case 'CLARIFICATION_REQUIRED':
      return <Badge variant="warning">⚠ {status.replace('_', ' ')}</Badge>;

    case 'UNABLE_TO_VERIFY':
    case 'CONFLICTING_EVIDENCE':
      return <Badge variant="danger">⚡ {status.replace('_', ' ')}</Badge>;

    case 'NOT_APPLICABLE':
    case 'PARTIAL':
      return <Badge variant="info">ℹ {status.replace('_', ' ')}</Badge>;

    case 'PENDING':
    case 'PROCESSING':
    default:
      return <Badge variant="neutral">○ {status.replace('_', ' ')}</Badge>;
  }
};
