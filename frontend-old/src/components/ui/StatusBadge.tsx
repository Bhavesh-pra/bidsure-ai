import React from 'react';
import { Badge } from './Badge';
import { StatusKey, STATUS } from '../../constants/statuses';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Info, HelpCircle } from 'lucide-react';

export interface StatusBadgeProps {
  status: StatusKey | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const s = (status || '').toString().toUpperCase();

  switch (s) {
    case STATUS.VERIFIED_PASS:
    case STATUS.PASS:
    case STATUS.QUALIFIED:
    case 'VERIFIED':
    case 'PROCESSED':
    case 'EXTRACTED':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>{s.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case STATUS.VERIFIED_FAIL:
    case STATUS.FAIL:
    case STATUS.DISQUALIFIED:
    case 'FAILED':
    case 'EXTRACTION_FAILED':
      return (
        <Badge variant="danger" className={className}>
          <XCircle className="h-3 w-3 shrink-0" />
          <span>{s.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case STATUS.REVIEW:
    case 'REVIEW REQUIRED':
    case 'REVIEW_REQUIRED':
      return (
        <Badge variant="warning" className={className}>
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>{s.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case STATUS.UNABLE_TO_VERIFY:
    case STATUS.CONFLICTING_EVIDENCE:
    case 'EVIDENCE MISSING':
    case 'EVIDENCE_MISSING':
      return (
        <Badge variant="warning" className={className}>
          <HelpCircle className="h-3 w-3 shrink-0" />
          <span>{s.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case STATUS.NOT_APPLICABLE:
    case STATUS.PARTIAL:
      return (
        <Badge variant="info" className={className}>
          <Info className="h-3 w-3 shrink-0" />
          <span>{s.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case STATUS.PENDING:
    case STATUS.PROCESSING:
    case 'EXTRACTING':
    default:
      return (
        <Badge variant="neutral" className={className}>
          <Clock className="h-3 w-3 shrink-0" />
          <span>{s.replace(/_/g, ' ')}</span>
        </Badge>
      );
  }
};
