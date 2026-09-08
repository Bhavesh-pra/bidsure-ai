import React from 'react';
import { Badge } from './Badge';
import { StatusKey, STATUS } from '../../constants/statuses';

export interface StatusBadgeProps {
  status: StatusKey | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = (status || '').toString();

  switch (s) {
    case STATUS.VERIFIED_PASS:
    case STATUS.PASS:
    case STATUS.QUALIFIED:
      return <Badge variant="success">✓ {s.replace(/_/g, ' ')}</Badge>;

    case STATUS.VERIFIED_FAIL:
    case STATUS.FAIL:
    case STATUS.DISQUALIFIED:
      return <Badge variant="danger">✕ {s.replace(/_/g, ' ')}</Badge>;

    case STATUS.REVIEW:
      return <Badge variant="warning">⚠ {s.replace(/_/g, ' ')}</Badge>;

    case STATUS.UNABLE_TO_VERIFY:
    case STATUS.CONFLICTING_EVIDENCE:
      return <Badge variant="danger">⚡ {s.replace(/_/g, ' ')}</Badge>;

    case STATUS.NOT_APPLICABLE:
    case STATUS.PARTIAL:
      return <Badge variant="info">ℹ {s.replace(/_/g, ' ')}</Badge>;

    case STATUS.PENDING:
    case STATUS.PROCESSING:
    default:
      return <Badge variant="neutral">○ {s.replace(/_/g, ' ')}</Badge>;
  }
};
